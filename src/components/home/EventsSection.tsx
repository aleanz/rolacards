'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  type: string;
  format: string | null;
  entryFee: string | null;
  maxPlayers: number | null;
  prizeInfo: string | null;
  imageUrl: string | null;
  published: boolean;
  featured: boolean;
}

const eventTypeLabels = {
  TOURNAMENT: { label: 'Torneo', color: 'badge-gold' },
  SNEAK_PEEK: { label: 'Sneak Peek', color: 'badge-purple' },
  LOCALS: { label: 'Locals', color: 'badge-blue' },
  SPECIAL_EVENT: { label: 'Especial', color: 'badge-green' },
  ANNOUNCEMENT: { label: 'Aviso', color: 'badge-red' },
};

function formatEventDate(date: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function isToday(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

export default function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      // Obtener eventos publicados y próximos
      const response = await fetch('/api/events?published=true&upcoming=true');
      if (response.ok) {
        const data = await response.json();
        // Ordenar: destacados primero, luego por fecha
        const sortedEvents = data.sort((a: Event, b: Event) => {
          // Si uno es destacado y el otro no, el destacado va primero
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          // Si ambos tienen el mismo estado de destacado, ordenar por fecha
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        // Limitar a los primeros 3 eventos
        setEvents(sortedEvents.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="section">
        <div className="container-custom">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando eventos...</p>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="section">
        <div className="container-custom">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              No hay eventos próximos
            </h3>
            <p className="text-gray-400">
              Pronto anunciaremos nuevos torneos y eventos especiales
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="eventos" className="section">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
              Próximos <span className="text-gradient">Eventos</span>
            </h2>
            <p className="text-gray-400 max-w-xl">
              No te pierdas nuestros torneos y eventos especiales.
              Inscríbete y demuestra tu habilidad.
            </p>
          </div>
          <Link
            href="/eventos"
            className="btn btn-outline self-start md:self-auto"
          >
            Ver todos los eventos
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {events.map((event, index) => {
            const eventDate = new Date(event.date);
            const typeInfo = eventTypeLabels[event.type as keyof typeof eventTypeLabels];
            const isFeaturedFirst = index === 0 && event.featured;
            const eventIsToday = isToday(eventDate);

            return (
              <article
                key={event.id}
                className={cn(
                  'card card-hover card-shine group relative overflow-hidden',
                  isFeaturedFirst && 'lg:col-span-2 lg:row-span-2'
                )}
              >
                {/* Event image if available */}
                {event.imageUrl && isFeaturedFirst && (
                  <div className="absolute inset-0 opacity-10">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Featured event (first one and marked as featured) gets special treatment */}
                {isFeaturedFirst ? (
                  <div className="p-8 h-full flex flex-col relative z-10">
                    {/* Badge */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className={cn('badge', typeInfo.color)}>
                        {typeInfo.label}
                      </span>
                      {event.featured && (
                        <span className="badge badge-gold">
                          <Trophy className="w-3 h-3 mr-1" />
                          Destacado
                        </span>
                      )}
                      {eventIsToday && (
                        <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                          HOY
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-4 group-hover:text-rola-gold transition-colors">
                      {event.title}
                    </h3>

                    {/* Description */}
                    {event.description && (
                      <p className="text-gray-400 mb-6">
                        {event.description}
                      </p>
                    )}

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-10 h-10 rounded-lg bg-rola-gray/50 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-rola-gold" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{formatEventDate(eventDate)}</p>
                          <p className="text-sm">{formatEventTime(eventDate)}</p>
                        </div>
                      </div>
                      {event.maxPlayers && (
                        <div className="flex items-center gap-3 text-gray-400">
                          <div className="w-10 h-10 rounded-lg bg-rola-gray/50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-rola-gold" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{event.maxPlayers} lugares</p>
                            {event.format && <p className="text-sm">Formato: {event.format}</p>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prize info */}
                    {event.prizeInfo && (
                      <p className="text-gray-400 mb-6 flex-grow">
                        {event.prizeInfo}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-rola-gray/50">
                      <div>
                        <p className="text-gray-500 text-sm">Precio</p>
                        <p className="text-2xl font-bold text-rola-gold">
                          {!event.entryFee || Number(event.entryFee) === 0 ? 'GRATIS' : `$${event.entryFee} MXN`}
                        </p>
                      </div>
                      <Link
                        href={`/eventos/${event.slug}`}
                        className="btn btn-primary ml-auto"
                      >
                        Ver detalles
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={cn('badge', typeInfo.color)}>
                        {typeInfo.label}
                      </span>
                      {eventIsToday && (
                        <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                          HOY
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl font-bold text-white mb-4 group-hover:text-rola-gold transition-colors">
                      {event.title}
                    </h3>

                    {/* Info */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4 text-rola-gold" />
                        {formatEventDate(eventDate)} - {formatEventTime(eventDate)}
                      </div>
                      {event.maxPlayers && (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                          <Users className="w-4 h-4 text-rola-gold" />
                          {event.maxPlayers} lugares
                          {event.format && ` · ${event.format}`}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <p className="text-rola-gold font-bold">
                        {!event.entryFee || Number(event.entryFee) === 0 ? 'GRATIS' : `$${event.entryFee} MXN`}
                      </p>
                      <Link
                        href={`/eventos/${event.slug}`}
                        className="text-sm text-gray-400 hover:text-rola-gold transition-colors inline-flex items-center gap-1 ml-auto"
                      >
                        Ver más
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rola-gold/5 to-transparent" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
