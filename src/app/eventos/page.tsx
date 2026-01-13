'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Trophy, Filter, Search } from 'lucide-react';

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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatEventTime(date: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const months = [
  { value: '', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

const currentYear = new Date().getFullYear();
const years = [
  { value: '', label: 'Todos los años' },
  { value: String(currentYear), label: String(currentYear) },
  { value: String(currentYear + 1), label: String(currentYear + 1) },
];

export default function EventosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [selectedMonth, selectedYear]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('published', 'true');
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);

      const response = await fetch(`/api/events?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      event.title.toLowerCase().includes(search) ||
      event.description?.toLowerCase().includes(search) ||
      event.location?.toLowerCase().includes(search)
    );
  });

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSearchTerm('');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="section">
          <div className="container-custom">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                Nuestros <span className="text-gradient">Eventos</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Descubre todos nuestros torneos, eventos especiales y competencias. ¡No te pierdas ninguno!
              </p>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4 mb-8">
              {/* Search Bar */}
              <div className="card p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar eventos por nombre, descripción o ubicación..."
                    className="w-full pl-12 pr-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-outline"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                </button>
                <p className="text-gray-400 text-sm">
                  {filteredEvents.length} evento{filteredEvents.length !== 1 ? 's' : ''} encontrado
                  {filteredEvents.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="card p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Mes</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Año */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Año</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                      >
                        {years.map((year) => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button onClick={clearFilters} className="btn btn-ghost w-full mt-4">
                    Limpiar Filtros
                  </button>
                </div>
              )}
            </div>

            {/* Events List */}
            {isLoading ? (
              <div className="text-center py-12 card">
                <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Cargando eventos...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="space-y-6">
                {filteredEvents.map((event) => {
                  const eventDate = new Date(event.date);
                  const typeInfo =
                    eventTypeLabels[event.type as keyof typeof eventTypeLabels] ||
                    eventTypeLabels.ANNOUNCEMENT;

                  return (
                    <Link
                      key={event.id}
                      href={`/eventos/${event.slug}`}
                      className="card p-6 hover:border-rola-gold transition-all group block"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        {event.imageUrl && (
                          <div className="md:w-48 h-48 flex-shrink-0">
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-display text-xl md:text-2xl font-bold text-white group-hover:text-rola-gold transition-colors mb-2">
                                {event.title}
                              </h3>
                              <span className={`badge ${typeInfo.color}`}>{typeInfo.label}</span>
                            </div>
                            {event.featured && (
                              <Trophy className="w-6 h-6 text-rola-gold flex-shrink-0" />
                            )}
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="text-gray-400 line-clamp-2">{event.description}</p>
                          )}

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4 text-rola-gold flex-shrink-0" />
                              <span className="text-sm">{formatEventDate(eventDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="w-4 h-4 text-rola-gold flex-shrink-0" />
                              <span className="text-sm">{formatEventTime(eventDate)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-gray-400">
                                <MapPin className="w-4 h-4 text-rola-gold flex-shrink-0" />
                                <span className="text-sm">{event.location}</span>
                              </div>
                            )}
                            {event.maxPlayers && (
                              <div className="flex items-center gap-2 text-gray-400">
                                <Users className="w-4 h-4 text-rola-gold flex-shrink-0" />
                                <span className="text-sm">Máx. {event.maxPlayers} jugadores</span>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-rola-gray/30">
                            {event.entryFee && (
                              <span className="text-rola-gold font-semibold">
                                Entrada: ${event.entryFee}
                              </span>
                            )}
                            {event.format && (
                              <span className="text-gray-500 text-sm">{event.format}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 card">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No se encontraron eventos</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
