import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export async function verifyMobileToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Obtener usuario actualizado de la base de datos
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        avatar: true,
        konamiId: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error verifying mobile token:', error);
    return null;
  }
}
