import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    // Verificar sesión web o token móvil
    const session = await getServerSession(authOptions);
    const mobileUser = !session ? await verifyMobileToken(req) : null;

    const userId = session?.user?.id || mobileUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        konamiId: true,
        emailVerified: true,
        createdAt: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Verificar sesión web o token móvil
    const session = await getServerSession(authOptions);
    const mobileUser = !session ? await verifyMobileToken(req) : null;

    const userId = session?.user?.id || mobileUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, konamiId } = await req.json();

    // Validar campos
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        konamiId: konamiId?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        konamiId: true,
        emailVerified: true,
        createdAt: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
