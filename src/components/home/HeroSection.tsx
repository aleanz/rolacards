'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden hero-bg">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating card shapes */}
        <div 
          className={`absolute top-1/4 left-10 w-32 h-44 bg-gradient-to-br from-rola-gold/10 to-transparent rounded-lg rotate-12 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{ animationDelay: '0.2s' }}
        />
        <div 
          className={`absolute top-1/3 right-20 w-24 h-36 bg-gradient-to-br from-rola-purple/10 to-transparent rounded-lg -rotate-12 transition-all duration-1000 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        />
        <div 
          className={`absolute bottom-1/4 left-1/4 w-20 h-28 bg-gradient-to-br from-rola-blue/10 to-transparent rounded-lg rotate-6 transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        />
        
      </div>

      {/* Content */}
      <div className="relative z-10 container-custom text-center px-4">
        {/* Main Title */}
        <h1 
          className={`font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 transition-all duration-700 delay-150 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span className="text-white">ROLA</span>
          <br />
          <span className="text-gradient">CARDS</span>
        </h1>

        {/* Subtitle */}
        <p 
          className={`text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Cartas coleccionables, torneos épicos y una comunidad apasionada. 
          Encuentra las cartas que buscas y vive la experiencia del juego competitivo.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Link href="/eventos" className="btn btn-primary btn-lg group">
            <Calendar className="w-5 h-5" />
            Ver Eventos
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/catalogo" className="btn btn-outline btn-lg">
            Explorar Catálogo
          </Link>
        </div>

        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rola-gold/10 border border-rola-gold/30 mt-10 mb-6 transition-all duration-700 delay-600 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Sparkles className="w-4 h-4 text-rola-gold" />
          <span className="text-rola-gold text-sm font-medium">Tu tienda de cartas TCG</span>
        </div>

        {/* Stats */}
        <div
          className={`grid grid-cols-3 gap-8 max-w-xl mx-auto pt-6 border-t border-rola-gray/30 transition-all duration-700 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div>
            <p className="font-display text-3xl md:text-4xl font-bold text-rola-gold">500+</p>
            <p className="text-gray-500 text-sm mt-1">Cartas en stock</p>
          </div>
          <div>
            <p className="font-display text-3xl md:text-4xl font-bold text-rola-gold">50+</p>
            <p className="text-gray-500 text-sm mt-1">Torneos al año</p>
          </div>
          <div>
            <p className="font-display text-3xl md:text-4xl font-bold text-rola-gold">100+</p>
            <p className="text-gray-500 text-sm mt-1">Jugadores activos</p>
          </div>
        </div>
      </div>

    </section>
  );
}
