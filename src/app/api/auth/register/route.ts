import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { randomBytes, randomUUID } from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validar campos requeridos
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hashear contraseña
    const hashedPassword = await hash(password, 12);

    // Generar token de verificación
    const verificationToken = randomBytes(32).toString('hex');

    // Crear usuario con rol CLIENTE
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: 'CLIENTE',
        emailVerified: false,
        verificationToken,
        updatedAt: new Date(),
      },
    });

    // Enviar email de verificación
    const emailResult = await sendVerificationEmail(email, verificationToken, name);

    if (!emailResult.success) {
      console.warn('⚠️ No se pudo enviar el email de verificación, pero el usuario fue creado');
      // Fallback: mostrar el link en consola
      console.log('Token de verificación:', verificationToken);
      console.log('Link de verificación:', `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${verificationToken}`);
    }

    return NextResponse.json(
      {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    // Return more detailed error in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Error al registrar usuario',
        ...(isDevelopment && { details: error instanceof Error ? error.message : String(error) })
      },
      { status: 500 }
    );
  }
}
