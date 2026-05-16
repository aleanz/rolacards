import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 flex items-center">
        <div className="container-custom text-center">
          <h1 className="font-display text-6xl md:text-8xl font-bold text-rola-gold mb-4">
            404
          </h1>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            La página que buscas no existe o fue movida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="btn btn-primary">
              Ir al inicio
            </Link>
            <Link href="/catalogo" className="btn btn-outline">
              Ver catálogo
            </Link>
            <Link href="/eventos" className="btn btn-outline">
              Ver eventos
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
