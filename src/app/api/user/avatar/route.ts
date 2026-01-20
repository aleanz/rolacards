import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const avatarFile = formData.get('avatar') as File | null;

    if (!avatarFile) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(avatarFile.type)) {
      return NextResponse.json(
        { error: 'Solo se permiten imágenes JPG, PNG o WEBP' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 2MB)
    if (avatarFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 2MB' },
        { status: 400 }
      );
    }

    // Obtener usuario actual para eliminar avatar anterior de Cloudinary
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    // Convertir el archivo a Buffer
    const bytes = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Subir a Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'rolacards/avatars',
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const avatarUrl = uploadResult.secure_url;

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    // Eliminar avatar anterior de Cloudinary si existe
    if (user?.avatar && user.avatar.includes('cloudinary.com')) {
      try {
        // Extraer el public_id del URL de Cloudinary
        const publicIdMatch = user.avatar.match(/\/rolacards\/avatars\/([^/]+)\./);
        if (publicIdMatch) {
          const publicId = `rolacards/avatars/${publicIdMatch[1]}`;
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.warn('No se pudo eliminar avatar anterior de Cloudinary:', error);
      }
    }

    return NextResponse.json({
      message: 'Avatar actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Error al subir avatar' },
      { status: 500 }
    );
  }
}
