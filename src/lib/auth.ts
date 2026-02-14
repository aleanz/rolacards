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
  debug: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Login attempt for:', credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            console.log('❌ Missing credentials');
            throw new Error('Credenciales inválidas');
          }

          console.log('🔍 Searching user in database...');
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            console.log('❌ User not found:', credentials.email);
            throw new Error('Usuario no encontrado');
          }

          console.log('✅ User found:', user.email);
          console.log('🔑 Verifying password...');
          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.log('❌ Invalid password for:', user.email);
            throw new Error('Contraseña incorrecta');
          }

          // Verificar si es un cliente sin email verificado
          if (user.role === 'CLIENTE' && !user.emailVerified) {
            console.log('⚠️ Cliente sin email verificado:', user.email);
            throw new Error('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
          }

          console.log('✅ Login successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
            image: user.avatar,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
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
