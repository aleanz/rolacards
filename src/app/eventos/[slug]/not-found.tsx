import Link from 'next/link';
import { Calendar, ArrowLeft, Home } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function EventNotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center py-20">
            {/* Icon */}
            <div className="w-24 h-24 bg-rola-gray/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-gray-600" />
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Evento no encontrado
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-400 mb-8">
              Lo sentimos, el evento que buscas no existe o ha sido eliminado.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/#eventos"
                className="btn btn-primary"
              >
                <ArrowLeft className="w-5 h-5" />
                Ver eventos
              </Link>
              <Link
                href="/"
                className="btn btn-outline"
              >
                <Home className="w-5 h-5" />
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
