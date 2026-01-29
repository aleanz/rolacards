import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'El correo electrónico es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Siempre responder con éxito para no revelar si el email existe
    if (!user) {
      return NextResponse.json({
        message: 'Si el correo existe y no está verificado, recibirás un nuevo enlace de verificación.',
      });
    }

    // Si ya está verificado, no enviar
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Tu cuenta ya está verificada. Puedes iniciar sesión.',
        alreadyVerified: true,
      });
    }

    // Generar nuevo token de verificación
    const verificationToken = randomUUID();

    // Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        updatedAt: new Date(),
      },
    });

    // Enviar email
    const emailResult = await sendVerificationEmail(user.email, verificationToken, user.name);

    if (!emailResult.success) {
      console.error('Error enviando email de verificación:', emailResult.error);
      return NextResponse.json(
        { error: 'Error al enviar el correo. Intenta de nuevo más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Se ha enviado un nuevo correo de verificación.',
    });
  } catch (error) {
    console.error('Error en resend-verification:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
