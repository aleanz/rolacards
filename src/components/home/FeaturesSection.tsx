'use client';

import { useEffect, useRef, useState } from 'react';
import { 
  Trophy, 
  ShoppingBag, 
  Users, 
  Calendar,
  Sparkles,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Trophy,
    title: 'Torneos Competitivos',
    description: 'Participa en nuestros torneos semanales y eventos especiales. Premios increíbles y ranking local.',
    color: 'gold',
  },
  {
    icon: ShoppingBag,
    title: 'Amplio Catálogo',
    description: 'Cartas individuales, producto sellado, accesorios y todo lo que necesitas para tu deck.',
    color: 'purple',
  },
  {
    icon: Users,
    title: 'Comunidad Activa',
    description: 'Únete a nuestra comunidad de jugadores. Intercambios, partidas casuales y más.',
    color: 'blue',
  },
  {
    icon: Calendar,
    title: 'Eventos Especiales',
    description: 'Sneak Peeks, lanzamientos y eventos exclusivos. Sé el primero en tener las nuevas cartas.',
    color: 'green',
  },
  {
    icon: Target,
    title: 'Precios Competitivos',
    description: 'Los mejores precios del mercado en cartas individuales y producto sellado.',
    color: 'red',
  },
  {
    icon: Sparkles,
    title: 'Cartas de Calidad',
    description: 'Todas nuestras cartas son verificadas. Condición garantizada en cada compra.',
    color: 'gold',
  },
];

const colorClasses = {
  gold: {
    icon: 'text-rola-gold',
    bg: 'bg-rola-gold/10',
    border: 'group-hover:border-rola-gold/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(212,168,67,0.2)]',
  },
  purple: {
    icon: 'text-rola-purple-light',
    bg: 'bg-rola-purple/10',
    border: 'group-hover:border-rola-purple/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]',
  },
  blue: {
    icon: 'text-rola-blue',
    bg: 'bg-rola-blue/10',
    border: 'group-hover:border-rola-blue/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]',
  },
  green: {
    icon: 'text-rola-green',
    bg: 'bg-rola-green/10',
    border: 'group-hover:border-rola-green/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]',
  },
  red: {
    icon: 'text-rola-red',
    bg: 'bg-rola-red/10',
    border: 'group-hover:border-rola-red/50',
    glow: 'group-hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]',
  },
};

export default function FeaturesSection() {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animations
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems((prev) => [...prev, index]);
              }, index * 100);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="porque-rola-cards" ref={sectionRef} className="section bg-rola-darker">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            ¿Por qué <span className="text-gradient">Rola Cards</span>?
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Somos más que una tienda de cartas. Somos una comunidad de jugadores apasionados 
            por el TCG.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            const isVisible = visibleItems.includes(index);
            
            return (
              <div
                key={feature.title}
                className={cn(
                  'group card card-hover p-6 transition-all duration-500',
                  colors.border,
                  colors.glow,
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110',
                  colors.bg
                )}>
                  <feature.icon className={cn('w-7 h-7', colors.icon)} />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
