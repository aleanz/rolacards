import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token de verificación requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario por token
    const user = await prisma.user.findUnique({
      where: {
        verificationToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token de verificación inválido o expirado' },
        { status: 400 }
      );
    }

    // Si ya está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email ya verificado' },
        { status: 200 }
      );
    }

    // Verificar email y limpiar token
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return NextResponse.json(
      { message: 'Email verificado exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Error al verificar el email' },
      { status: 500 }
    );
  }
}
