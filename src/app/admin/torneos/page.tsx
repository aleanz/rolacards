'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useModal } from '@/hooks/useModal';
import {
  Trophy,
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
  Play,
  Eye,
  Calendar,
  Swords,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/admin/PageHeader';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format: string | null;
  date: string;
  location: string | null;
  entryFee: string | null;
  maxPlayers: number | null;
  prizeInfo: string | null;
  imageUrl: string | null;
  status: TournamentStatus;
  currentRound: number;
  totalRounds: number;
  roundTimeMinutes: number;
  tier: string;
  createdAt: string;
  Creator: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    Participants: number;
    Matches: number;
  };
}

type TournamentStatus = 'REGISTRATION' | 'READY' | 'IN_PROGRESS' | 'TOP_CUT' | 'FINISHED' | 'CANCELLED';

interface TournamentFormData {
  name: string;
  description: string;
  format: string;
  date: string;
  location: string;
  entryFee: string;
  maxPlayers: string;
  prizeInfo: string;
  imageUrl: string;
  tier: string;
  roundTimeMinutes: string;
  eventId: string;
}

const TOURNAMENT_FORMATS = [
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'ocg', label: 'OCG' },
  { value: 'goat', label: 'GOAT' },
  { value: 'edison', label: 'Edison' },
  { value: 'genesys', label: 'Genesys' },
];

const TOURNAMENT_TIERS = [
  { value: 'TIER_1', label: 'Tier 1 - Locals' },
  { value: 'TIER_2', label: 'Tier 2 - Regionales' },
  { value: 'TIER_3', label: 'Tier 3 - YCS/WCQ' },
  { value: 'TIER_4', label: 'Tier 4 - Mundiales' },
];

const STATUS_LABELS: Record<TournamentStatus, { label: string; color: string }> = {
  REGISTRATION: { label: 'Registro abierto', color: 'bg-blue-500/20 text-blue-400' },
  READY: { label: 'Listo para iniciar', color: 'bg-yellow-500/20 text-yellow-400' },
  IN_PROGRESS: { label: 'En progreso', color: 'bg-green-500/20 text-green-400' },
  TOP_CUT: { label: 'Top Cut', color: 'bg-purple-500/20 text-purple-400' },
  FINISHED: { label: 'Finalizado', color: 'bg-gray-500/20 text-gray-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
};

export default function TorneosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [events, setEvents] = useState<{
    id: string;
    title: string;
    description: string | null;
    date: string;
    location: string | null;
    format: string | null;
    entryFee: string | null;
    maxPlayers: number | null;
    prizeInfo: string | null;
    imageUrl: string | null;
    EventRegistration?: any[];
    _count?: { EventRegistration: number };
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    format: '',
    date: '',
    location: '',
    entryFee: '',
    maxPlayers: '',
    prizeInfo: '',
    imageUrl: '',
    tier: 'TIER_1',
    roundTimeMinutes: '50',
    eventId: '',
  });
  const [formError, setFormError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchTournaments();
    fetchEvents();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?type=TOURNAMENT');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'events');

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

  const handleEventSelect = (eventId: string) => {
    if (!eventId) {
      // Si deselecciona el evento, limpiar los campos
      setFormData({
        name: '',
        description: '',
        format: '',
        date: '',
        location: '',
        entryFee: '',
        maxPlayers: '',
        prizeInfo: '',
        imageUrl: '',
        tier: 'TIER_1',
        roundTimeMinutes: '50',
        eventId: '',
      });
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    // Mapear formato del evento al formato del torneo
    const formatMap: Record<string, string> = {
      'avanzado': 'avanzado',
      'tcg': 'avanzado',
      'advanced': 'avanzado',
      'ocg': 'ocg',
      'goat': 'goat',
      'edison': 'edison',
      'genesys': 'genesys',
    };
    const mappedFormat = event.format
      ? formatMap[event.format.toLowerCase()] || event.format.toLowerCase()
      : '';

    setFormData((prev) => ({
      ...prev,
      eventId,
      name: event.title || '',
      description: event.description || '',
      format: mappedFormat,
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      entryFee: event.entryFee ? String(event.entryFee) : '',
      maxPlayers: event.maxPlayers ? String(event.maxPlayers) : '',
      prizeInfo: event.prizeInfo || '',
      imageUrl: event.imageUrl || '',
    }));
  };

  const handleOpenModal = (tournament?: Tournament) => {
    if (tournament) {
      setEditingTournament(tournament);
      setFormData({
        name: tournament.name,
        description: tournament.description || '',
        format: tournament.format || '',
        date: new Date(tournament.date).toISOString().slice(0, 16),
        location: tournament.location || '',
        entryFee: tournament.entryFee || '',
        maxPlayers: tournament.maxPlayers?.toString() || '',
        prizeInfo: tournament.prizeInfo || '',
        imageUrl: tournament.imageUrl || '',
        tier: tournament.tier,
        roundTimeMinutes: tournament.roundTimeMinutes.toString(),
        eventId: '',
      });
    } else {
      setEditingTournament(null);
      setFormData({
        name: '',
        description: '',
        format: '',
        date: '',
        location: '',
        entryFee: '',
        maxPlayers: '',
        prizeInfo: '',
        imageUrl: '',
        tier: 'TIER_1',
        roundTimeMinutes: '50',
        eventId: '',
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTournament(null);
    setFormError('');
  };

  const { handleBackdropClick } = useModal({ isOpen: isModalOpen, onClose: handleCloseModal });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingTournament) {
        const response = await fetch(`/api/tournaments/${editingTournament.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al actualizar torneo');
          return;
        }
        toast.success('Torneo actualizado correctamente');
      } else {
        const response = await fetch('/api/tournaments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al crear torneo');
          return;
        }
        toast.success('Torneo creado correctamente');
      }

      await fetchTournaments();
      handleCloseModal();
    } catch (error) {
      setFormError('Ocurrió un error. Intenta de nuevo.');
    }
  };

  const handleDelete = async (tournamentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este torneo?')) return;

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchTournaments();
          resolve('Torneo eliminado correctamente');
        } else {
          const error = await response.json();
          reject(error.error || 'Error al eliminar torneo');
        }
      } catch (error) {
        reject('Error al eliminar torneo');
      }
    });

    toast.promise(deletePromise, {
      loading: 'Eliminando torneo...',
      success: (msg) => msg as string,
      error: (err) => err as string,
    });
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || tournament.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isAdmin = session?.user.role === 'ADMIN';

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: TournamentStatus) => {
    switch (status) {
      case 'REGISTRATION':
        return <Users className="w-4 h-4" />;
      case 'READY':
        return <AlertCircle className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Play className="w-4 h-4" />;
      case 'TOP_CUT':
        return <Trophy className="w-4 h-4" />;
      case 'FINISHED':
        return <CheckCircle className="w-4 h-4" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de Torneos"
        description="Administra torneos con formato suizo según reglas oficiales de Konami"
        action={
          isAdmin ? (
            <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm sm:btn w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Torneo</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar torneos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tournaments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando torneos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTournaments.map((tournament) => (
            <div key={tournament.id} className="card p-6">
              {/* Image */}
              {tournament.imageUrl && (
                <div className="mb-4 -mx-6 -mt-6">
                  <img
                    src={tournament.imageUrl}
                    alt={tournament.name}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-2">{tournament.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${STATUS_LABELS[tournament.status].color}`}>
                      {getStatusIcon(tournament.status)}
                      {STATUS_LABELS[tournament.status].label}
                    </span>
                    {tournament.format && (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                        {TOURNAMENT_FORMATS.find(f => f.value === tournament.format)?.label || tournament.format}
                      </span>
                    )}
                    <span className="inline-block px-2 py-1 text-xs rounded bg-rola-gold/20 text-rola-gold">
                      {TOURNAMENT_TIERS.find(t => t.value === tournament.tier)?.label.split(' - ')[1] || tournament.tier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {tournament.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tournament.description}</p>
              )}

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(tournament.date)}</span>
                </div>
                {tournament.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{tournament.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>
                    {tournament._count.Participants} jugadores
                    {tournament.maxPlayers && ` / ${tournament.maxPlayers} máx`}
                  </span>
                </div>
                {tournament.status === 'IN_PROGRESS' || tournament.status === 'TOP_CUT' ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Swords className="w-4 h-4" />
                    <span>
                      Ronda {tournament.currentRound} de {tournament.totalRounds}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{tournament.roundTimeMinutes} min por ronda</span>
                </div>
                {tournament.entryFee && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Trophy className="w-4 h-4" />
                    <span>Inscripción: ${tournament.entryFee}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-rola-gray/30">
                <button
                  onClick={() => router.push(`/admin/torneos/${tournament.id}`)}
                  className="flex-1 btn btn-ghost btn-sm text-rola-gold"
                >
                  <Eye className="w-4 h-4" />
                  Gestionar
                </button>
                {isAdmin && tournament.status === 'REGISTRATION' && (
                  <>
                    <button onClick={() => handleOpenModal(tournament)} className="btn btn-ghost btn-sm">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament.id)}
                      className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTournaments.length === 0 && !isLoading && (
        <div className="text-center py-12 card">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron torneos</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto" onClick={handleBackdropClick}>
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-6 max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-white">
                  {editingTournament ? 'Editar Torneo' : 'Nuevo Torneo'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Import from Event */}
                {!editingTournament && events.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Importar desde evento (opcional)
                    </label>
                    <select
                      value={formData.eventId}
                      onChange={(e) => handleEventSelect(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">No importar</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} ({event.EventRegistration?.length || event._count?.EventRegistration || 0} inscritos)
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Importará los jugadores aprobados del evento y llenará los campos automáticamente
                    </p>
                  </div>
                )}

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Imagen del torneo</label>
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg mb-2" />
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del torneo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fecha *</label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ubicación</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Formato</label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Seleccionar formato</option>
                      {TOURNAMENT_FORMATS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      {TOURNAMENT_TIERS.map((tier) => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Inscripción</label>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Máx jugadores</label>
                    <input
                      type="number"
                      value={formData.maxPlayers}
                      onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                      placeholder="32"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Min por ronda</label>
                    <input
                      type="number"
                      value={formData.roundTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, roundTimeMinutes: e.target.value })}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                      placeholder="50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Premios</label>
                  <textarea
                    value={formData.prizeInfo}
                    onChange={(e) => setFormData({ ...formData, prizeInfo: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                    placeholder="Describe los premios del torneo"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="flex-1 btn btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 btn btn-primary">
                    <Save className="w-4 h-4" />
                    {editingTournament ? 'Actualizar' : 'Crear'}
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
