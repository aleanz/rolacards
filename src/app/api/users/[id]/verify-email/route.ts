import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/users/[id]/verify-email - Verificar email manualmente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Solo administradores pueden verificar emails
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = params.id;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Actualizar usuario para marcar email como verificado
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationToken: null, // Limpiar el token de verificación
      },
    });

    return NextResponse.json({
      message: 'Email verificado correctamente',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Error al verificar email' },
      { status: 500 }
    );
  }
}
