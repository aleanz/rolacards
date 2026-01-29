'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Si ya hay sesión activa, redirigir según el rol
  if (status === 'authenticated' && session) {
    if (session.user.role === 'CLIENTE') {
      router.push('/');
    } else {
      router.push('/admin/dashboard');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-rola-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas');
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Esperar un momento para que la sesión se actualice
        await new Promise(resolve => setTimeout(resolve, 100));

        // Usar window.location para forzar la recarga y obtener la sesión actualizada
        // Esto permite que el servidor decida la redirección según el rol
        window.location.href = '/auth/check-role';
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ocurrió un error. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-rola-black">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-10 w-32 h-44 bg-gradient-to-br from-rola-gold/10 to-transparent rounded-lg rotate-12 blur-xl" />
        <div className="absolute bottom-1/4 right-20 w-24 h-36 bg-gradient-to-br from-rola-purple/10 to-transparent rounded-lg -rotate-12 blur-xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8">
          <div className="relative w-40 h-20">
            <Image
              src="/logo.png"
              alt="Rola Cards"
              fill
              className="object-contain brightness-90 contrast-110"
              style={{ mixBlendMode: 'lighten' }}
            />
          </div>
        </Link>

        {/* Login Card */}
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-400">
              Accede al panel de administración
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary btn-lg"
            >
              {isLoading ? (
                <span>Iniciando sesión...</span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>

            {/* Forgot password link */}
            <div className="text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-gray-400 hover:text-rola-gold transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          {/* Create account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <Link
                href="/auth/register"
                className="text-rola-gold hover:text-rola-gold/80 transition-colors font-medium"
              >
                Regístrate
              </Link>
            </p>
          </div>

          {/* Resend verification */}
          <div className="mt-3 text-center">
            <Link
              href="/auth/resend-verification"
              className="text-sm text-gray-400 hover:text-rola-gold transition-colors"
            >
              ¿No recibiste el correo de verificación?
            </Link>
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-rola-gold transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
