import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Proteger rutas de admin - solo ADMIN y STAFF pueden acceder
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (token.role === 'CLIENTE') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Proteger rutas de mazos e inscripciones - requieren autenticación
  if (pathname.startsWith('/mazos') || pathname.startsWith('/inscripciones')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // IMPORTANTE: Solo verificar email para CLIENTES
  // ADMIN y STAFF no necesitan verificación
  if (token?.role === 'CLIENTE' && !token.emailVerified) {
    // Permitir acceso a páginas de verificación y logout
    if (
      pathname.startsWith('/auth/verify-email') ||
      pathname.startsWith('/api/auth/verify-email') ||
      pathname.startsWith('/api/auth/signout') ||
      pathname.startsWith('/auth/login') ||
      pathname === '/email-pendiente'
    ) {
      return NextResponse.next();
    }

    // Redirigir a página informativa si intenta acceder a otras rutas
    return NextResponse.redirect(new URL('/email-pendiente', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Proteger rutas de admin
    '/admin/:path*',
    '/api/admin/:path*',
    // Proteger rutas de cliente
    '/mazos/:path*',
    '/inscripciones/:path*',
    // Aplicar verificación de email a todas las rutas principales
    '/',
    '/eventos/:path*',
    '/catalogo/:path*',
    '/buscador/:path*',
    '/contacto/:path*',
    // Excluir rutas públicas y de autenticación (ya se manejan en el código)
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|patterns|auth).*)',
  ],
};
