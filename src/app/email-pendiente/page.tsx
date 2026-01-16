'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, LogOut } from 'lucide-react';

export default function EmailPendientePage() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
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

        {/* Card */}
        <div className="card p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-rola-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-rola-gold" />
            </div>

            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Verifica tu email
            </h1>

            <p className="text-gray-400 mb-6">
              Hemos enviado un correo de verificación a:
            </p>

            <div className="bg-rola-gray/30 rounded-lg p-4 mb-6">
              <p className="text-rola-gold font-medium">
                {session?.user?.email}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-400 text-left">
                Para poder usar tu cuenta, necesitas verificar tu correo electrónico.
              </p>

              <div className="bg-rola-purple/10 border border-rola-purple/20 rounded-lg p-4">
                <p className="text-xs text-gray-400">
                  <strong className="text-white">Nota:</strong> Revisa tu carpeta de spam si no ves el correo en tu bandeja de entrada.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleSignOut}
                className="btn btn-primary btn-lg"
              >
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </button>

              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-rola-gold transition-colors"
              >
                ← Volver al inicio (sin verificar)
              </button>
            </div>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-6 p-4 rounded-lg bg-rola-gray/30 border border-rola-gray">
          <p className="text-sm text-gray-300 mb-2">
            ¿No recibiste el correo?
          </p>
          <p className="text-xs text-gray-500">
            Contacta al soporte en{' '}
            <a href="mailto:soporte@rolacards.com" className="text-rola-gold hover:underline">
              soporte@rolacards.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
