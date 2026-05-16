import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Credenciales inválidas');
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            throw new Error('Usuario no encontrado');
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Contraseña incorrecta');
          }

          if (user.role === 'CLIENTE' && !user.emailVerified) {
            throw new Error('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
            image: user.avatar,
          };
        } catch (error) {
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // En el login inicial, guardar datos del usuario
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.emailVerified = !!user.emailVerified;
        token.picture = user.image;
      }

      // Actualizar token cuando se llama update() desde el cliente
      if (trigger === 'update') {
        // Obtener datos actualizados del usuario
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            avatar: true,
          },
        });

        if (updatedUser) {
          token.name = updatedUser.name;
          token.email = updatedUser.email;
          token.picture = updatedUser.avatar;
          token.role = updatedUser.role;
          token.emailVerified = updatedUser.emailVerified;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
};
