import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CardNotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 flex items-center">
        <div className="container-custom text-center">
          <h1 className="font-display text-6xl font-bold text-rola-gold mb-4">404</h1>
          <h2 className="font-display text-2xl font-bold text-white mb-4">
            Carta no encontrada
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            No se encontró la carta que buscas. Puede que el ID sea incorrecto.
          </p>
          <Link href="/buscador-cartas" className="btn btn-primary">
            Ir al buscador
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
