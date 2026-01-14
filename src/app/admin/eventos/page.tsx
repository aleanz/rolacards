'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  Upload,
  MapPin,
  Clock,
  Users,
  Trophy,
  Eye,
  EyeOff,
  Star,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
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
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface EventFormData {
  title: string;
  description: string;
  content: string;
  date: string;
  endDate: string;
  location: string;
  type: 'TOURNAMENT' | 'SNEAK_PEEK' | 'LOCALS' | 'SPECIAL_EVENT' | 'ANNOUNCEMENT';
  format: string;
  entryFee: string;
  maxPlayers: string;
  prizeInfo: string;
  imageUrl: string;
  published: boolean;
  featured: boolean;
}

const EVENT_TYPES = [
  { value: 'TOURNAMENT', label: 'Torneo' },
  { value: 'SNEAK_PEEK', label: 'Sneak Peek' },
  { value: 'LOCALS', label: 'Locals' },
  { value: 'SPECIAL_EVENT', label: 'Evento Especial' },
  { value: 'ANNOUNCEMENT', label: 'Anuncio' },
];

export default function EventosPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    content: '',
    date: '',
    endDate: '',
    location: '',
    type: 'TOURNAMENT',
    format: '',
    entryFee: '',
    maxPlayers: '',
    prizeInfo: '',
    imageUrl: '',
    published: false,
    featured: false,
  });
  const [formError, setFormError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || 'Error al subir imagen');
        return;
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      setFormError('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description || '',
        content: event.content || '',
        date: new Date(event.date).toISOString().slice(0, 16),
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        location: event.location || '',
        type: event.type as EventFormData['type'],
        format: event.format || '',
        entryFee: event.entryFee || '',
        maxPlayers: event.maxPlayers?.toString() || '',
        prizeInfo: event.prizeInfo || '',
        imageUrl: event.imageUrl || '',
        published: event.published,
        featured: event.featured,
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        date: '',
        endDate: '',
        location: '',
        type: 'TOURNAMENT',
        format: '',
        entryFee: '',
        maxPlayers: '',
        prizeInfo: '',
        imageUrl: '',
        published: false,
        featured: false,
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingEvent) {
        // Actualizar evento
        const response = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al actualizar evento');
          return;
        }
      } else {
        // Crear evento
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al crear evento');
          return;
        }
      }

      await fetchEvents();
      handleCloseModal();
    } catch (error) {
      setFormError('Ocurrió un error. Intenta de nuevo.');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar evento');
      }
    } catch (error) {
      alert('Error al eliminar evento');
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = session?.user.role === 'ADMIN';

  const getEventTypeLabel = (type: string) => {
    return EVENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const isEventPast = (date: string, endDate: string | null) => {
    const eventDate = endDate ? new Date(endDate) : new Date(date);
    return eventDate < new Date();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="Gestión de Eventos"
        description="Administra los eventos y torneos de la tienda"
        action={
          isAdmin ? (
            <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm sm:btn w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Evento</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
          />
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando eventos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const isPast = isEventPast(event.date, event.endDate);
            return (
              <div key={event.id} className="card p-6">
                {/* Image */}
                {event.imageUrl && (
                  <div className="mb-4 -mx-6 -mt-6">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                      {event.featured && (
                        <Star className="w-4 h-4 text-rola-gold fill-rola-gold" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          event.type === 'TOURNAMENT'
                            ? 'bg-purple-500/20 text-purple-400'
                            : event.type === 'SNEAK_PEEK'
                            ? 'bg-blue-500/20 text-blue-400'
                            : event.type === 'LOCALS'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {getEventTypeLabel(event.type)}
                      </span>
                      {isPast && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-400">
                          Finalizado
                        </span>
                      )}
                      {!event.published && (
                        <span className="inline-block px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
                          No publicado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.maxPlayers && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Máximo {event.maxPlayers} jugadores</span>
                    </div>
                  )}
                  {event.entryFee && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Trophy className="w-4 h-4" />
                      <span>Inscripción: ${event.entryFee}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-2 pt-4 border-t border-rola-gray/30">
                    <button
                      onClick={() => handleOpenModal(event)}
                      className="flex-1 btn btn-ghost btn-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredEvents.length === 0 && !isLoading && (
        <div className="text-center py-12 card">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron eventos</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-6 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white">
                {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Imagen del evento
                </label>
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg mb-2"
                  />
                )}
                <label className="btn btn-outline btn-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Subiendo...' : 'Subir imagen'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título del evento *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción corta
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contenido completo
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de fin (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="Ej: Tienda Rola Cards"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de evento *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as EventFormData['type'] })
                    }
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Formato</label>
                  <input
                    type="text"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    placeholder="Ej: Swiss, Single Elimination"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Costo de inscripción
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Máximo de jugadores
                  </label>
                  <input
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    placeholder="Ej: 32"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Premios</label>
                <textarea
                  value={formData.prizeInfo}
                  onChange={(e) => setFormData({ ...formData, prizeInfo: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                  placeholder="Describe los premios del evento"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 rounded border-rola-gray bg-rola-gray/50 text-rola-gold focus:ring-rola-gold focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    {formData.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Publicado
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-rola-gray bg-rola-gray/50 text-rola-gold focus:ring-rola-gold focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Destacado
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <Save className="w-4 h-4" />
                  {editingEvent ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
