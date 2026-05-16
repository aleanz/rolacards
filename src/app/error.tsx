'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 flex items-center">
        <div className="container-custom text-center">
          <h1 className="font-display text-6xl md:text-8xl font-bold text-rola-red mb-4">
            Error
          </h1>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            Algo salió mal
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Ocurrió un error inesperado. Por favor intenta de nuevo.
          </p>
          <button onClick={reset} className="btn btn-primary">
            Intentar de nuevo
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
