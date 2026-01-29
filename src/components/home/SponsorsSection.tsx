'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Handshake } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  linkUrl: string;
  order: number;
}

export default function SponsorsSection() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const response = await fetch('/api/sponsors');
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  // No mostrar la sección si no hay sponsors
  if (loading) {
    return null;
  }

  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-rola-dark border-t border-b border-rola-gray/30">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rola-gold/10 border border-rola-gold/20 mb-4">
            <Handshake className="w-4 h-4 text-rola-gold" />
            <span className="text-sm font-medium text-rola-gold">Nuestros Aliados</span>
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
            <span className="text-gradient">Sponsors</span>
          </h2>
        </div>

        {/* Sponsors Grid */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center p-4 bg-white/5 rounded-xl border border-rola-gray/30 hover:border-rola-gold/50 hover:bg-white/10 transition-all duration-300 hover:scale-105"
              title={sponsor.name}
            >
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  fill
                  className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
