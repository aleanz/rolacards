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

          console.log('✅ Login successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
