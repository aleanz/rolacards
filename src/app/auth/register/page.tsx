'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ocurrió un error al registrarte');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('Register error:', error);
      setError('Ocurrió un error. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-rola-black">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              ¡Registro exitoso!
            </h1>
            <p className="text-gray-400 mb-4">
              Se ha enviado un correo de verificación a tu email.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo al login...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Register Card */}
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              Crear Cuenta
            </h1>
            <p className="text-gray-400">
              Únete a la comunidad de Rola Cards
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

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
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary btn-lg"
            >
              {isLoading ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          {/* Already have account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/auth/login"
                className="text-rola-gold hover:text-rola-gold/80 transition-colors font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>

          {/* Back to home */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
