'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no encontrado');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('¡Email verificado correctamente! Ya puedes iniciar sesión.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Error al verificar el email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Ocurrió un error al verificar tu email');
      }
    };

    verifyEmail();
  }, [token, router]);

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

        {/* Verification Card */}
        <div className="card p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-rola-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">
                Verificando email
              </h1>
              <p className="text-gray-400">
                Por favor espera un momento...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">
                ¡Email verificado!
              </h1>
              <p className="text-gray-400 mb-6">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirigiendo al login...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white mb-2">
                Error al verificar
              </h1>
              <p className="text-gray-400 mb-6">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/auth/login" className="btn btn-primary">
                  Ir al login
                </Link>
                <Link href="/" className="text-sm text-gray-400 hover:text-rola-gold transition-colors">
                  ← Volver al inicio
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Need help */}
        {status === 'error' && (
          <div className="mt-6 p-4 rounded-lg bg-rola-gray/30 border border-rola-gray">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300 mb-1">
                  ¿Necesitas ayuda?
                </p>
                <p className="text-xs text-gray-500">
                  Si el problema persiste, contacta al soporte en{' '}
                  <a href="mailto:soporte@rolacards.com" className="text-rola-gold hover:underline">
                    soporte@rolacards.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-rola-black">
        <div className="w-full max-w-md relative z-10">
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
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-rola-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Cargando...
            </h1>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
