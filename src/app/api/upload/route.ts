import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] Request received');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('[Upload API] Unauthorized - No session');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'avatars'; // avatars, products, etc.

    console.log('[Upload API] File:', file?.name, 'Type:', type, 'Size:', file?.size);

    if (!file) {
      console.log('[Upload API] No file provided');
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    console.log('[Upload API] File type:', file.type);

    if (!allowedTypes.includes(file.type)) {
      console.log('[Upload API] Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten imágenes.' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('[Upload API] File too large:', file.size);
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let url: string;

    // Usar Cloudinary en producción, filesystem en desarrollo
    if (isCloudinaryConfigured()) {
      console.log('[Upload API] Using Cloudinary for storage');
      url = await uploadToCloudinary(buffer, type);
      console.log('[Upload API] Cloudinary URL:', url);
    } else {
      console.log('[Upload API] Using local filesystem for storage');

      // Generar nombre único
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
      console.log('[Upload API] Generated filename:', filename);

      // Crear directorio si no existe
      const uploadDir = join(process.cwd(), 'public', 'uploads', type);
      console.log('[Upload API] Upload directory:', uploadDir);

      if (!existsSync(uploadDir)) {
        console.log('[Upload API] Creating directory:', uploadDir);
        await mkdir(uploadDir, { recursive: true });
      }

      // Guardar archivo
      const path = join(uploadDir, filename);
      console.log('[Upload API] Saving file to:', path);
      await writeFile(path, buffer);

      // URL pública local
      url = `/uploads/${type}/${filename}`;
      console.log('[Upload API] Local URL:', url);
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[Upload API] Error uploading file:', error);
    console.error('[Upload API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Error al subir archivo',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
