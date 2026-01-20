import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

    // Obtener usuario actual para eliminar avatar anterior
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true },
    });

    const bytes = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear directorio si no existe
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }

    // Generar nombre único para el archivo
    const fileExtension = avatarFile.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Guardar archivo
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;

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

    // Eliminar avatar anterior si existe
    if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      try {
        const oldAvatarPath = join(process.cwd(), 'public', user.avatar);
        await unlink(oldAvatarPath);
      } catch (error) {
        console.warn('No se pudo eliminar avatar anterior:', error);
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
