'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      if (data.alreadyVerified) {
        setAlreadyVerified(true);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  if (alreadyVerified) {
    return (
      <div className="min-h-screen bg-rola-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-rola-gray/30 backdrop-blur-sm rounded-2xl border border-rola-gray/50 p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-4">
              Cuenta ya verificada
            </h1>
            <p className="text-gray-400 mb-6">
              Tu cuenta con el correo <span className="text-white font-medium">{email}</span> ya está verificada.
              Puedes iniciar sesión normalmente.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-rola-gold hover:bg-rola-gold/90 text-black font-semibold rounded-lg transition-colors"
            >
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-rola-dark flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-rola-gray/30 backdrop-blur-sm rounded-2xl border border-rola-gray/50 p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-4">
              Correo enviado
            </h1>
            <p className="text-gray-400 mb-6">
              Si existe una cuenta no verificada con el correo <span className="text-white font-medium">{email}</span>,
              recibirás un nuevo enlace de verificación.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Revisa tu bandeja de entrada y la carpeta de spam.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-rola-gold hover:text-rola-gold/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rola-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="Rola Cards"
              width={120}
              height={48}
              className="h-12 w-auto mx-auto"
            />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-rola-gray/30 backdrop-blur-sm rounded-2xl border border-rola-gray/50 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-rola-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-rola-gold" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Reenviar verificación
            </h1>
            <p className="text-gray-400 text-sm">
              ¿No recibiste el correo de verificación? Ingresa tu email y te enviaremos uno nuevo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-rola-dark border border-rola-gray/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rola-gold/50 focus:border-rola-gold transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-rola-gold hover:bg-rola-gold/90 disabled:bg-rola-gold/50 text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Reenviar correo de verificación'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
