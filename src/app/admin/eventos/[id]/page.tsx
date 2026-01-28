'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useModal } from '@/hooks/useModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Search,
  CreditCard,
  Loader2,
  Eye,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';

interface EventData {
  id: string;
  title: string;
  slug: string;
  date: string;
  endDate: string | null;
  location: string | null;
  type: string;
  format: string | null;
  entryFee: string | null;
  maxPlayers: number | null;
  imageUrl: string | null;
  published: boolean;
}

interface DeckCard {
  id: string;
  cardId: number;
  quantity: number;
  deckType: 'MAIN' | 'EXTRA' | 'SIDE';
  cardData: any;
}

interface Registration {
  id: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
  updatedAt: string;
  paymentProof: string | null;
  paymentProofType: string | null;
  transferReference: string | null;
  rejectionNote: string | null;
  paymentVerified: boolean;
  User: {
    id: string;
    name: string;
    email: string;
    konamiId: string | null;
  };
  Deck: {
    id: string;
    name: string;
    format: string | null;
    DeckCard: DeckCard[];
  };
}

const EVENT_TYPES: Record<string, string> = {
  TOURNAMENT: 'Torneo',
  SNEAK_PEEK: 'Sneak Peek',
  LOCALS: 'Locals',
  SPECIAL_EVENT: 'Evento Especial',
  ANNOUNCEMENT: 'Anuncio',
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchEventRegistrations();
    }
  }, [params.id]);

  const fetchEventRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${params.id}/registrations`);
      if (!response.ok) throw new Error('Error al cargar datos');
      const data = await response.json();
      setEvent(data.event);
      setRegistrations(data.registrations);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos del evento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APROBADO' | 'RECHAZADO') => {
    try {
      setProcessingId(id);

      const formData = new FormData();
      formData.append('status', status);
      if (status === 'RECHAZADO' && rejectionNote) {
        formData.append('rejectionNote', rejectionNote);
      }
      if (paymentProofFile) {
        formData.append('paymentProof', paymentProofFile);
      }

      const response = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar solicitud');
      }

      await fetchEventRegistrations();
      setShowModal(false);
      setSelectedRegistration(null);
      setRejectionNote('');
      setPaymentProofFile(null);

      toast.success(
        status === 'APROBADO' ? 'Inscripcion aprobada' : 'Inscripcion rechazada'
      );
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const openModal = (registration: Registration) => {
    setSelectedRegistration(registration);
    setShowModal(true);
    setRejectionNote('');
    setPaymentProofFile(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRegistration(null);
    setRejectionNote('');
    setPaymentProofFile(null);
  };

  const { handleBackdropClick } = useModal({ isOpen: showModal, onClose: closeModal });

  const filteredRegistrations = registrations
    .filter((reg) => (filter === 'all' ? true : reg.status === filter))
    .filter(
      (reg) =>
        reg.User.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.User.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.Deck.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const approvedCount = registrations.filter((r) => r.status === 'APROBADO').length;
  const pendingCount = registrations.filter((r) => r.status === 'PENDIENTE').length;
  const rejectedCount = registrations.filter((r) => r.status === 'RECHAZADO').length;

  const getPaymentLabel = (reg: Registration) => {
    if (!event?.entryFee || parseFloat(event.entryFee) === 0) return 'Gratis';
    if (reg.paymentVerified) return 'Verificado';
    if (reg.paymentProof) return 'Comprobante enviado';
    return 'Sin comprobante';
  };

  const getPaymentColor = (reg: Registration) => {
    if (!event?.entryFee || parseFloat(event.entryFee) === 0)
      return 'text-gray-400';
    if (reg.paymentVerified) return 'text-green-400';
    if (reg.paymentProof) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12 card">
        <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Evento no encontrado</p>
        <button onClick={() => router.push('/admin/eventos')} className="btn btn-primary mt-4">
          Volver a Eventos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title={event.title}
        description={`Inscritos al evento - ${EVENT_TYPES[event.type] || event.type}`}
        action={
          <button
            onClick={() => router.push('/admin/eventos')}
            className="btn btn-ghost btn-sm sm:btn w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        }
      />

      {/* Event Info Card */}
      <div className="card p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4 text-rola-gold flex-shrink-0" />
            <span>
              {format(new Date(event.date), "d 'de' MMMM, yyyy", { locale: es })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-rola-gold flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.format && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Trophy className="w-4 h-4 text-rola-gold flex-shrink-0" />
              <span className="capitalize">{event.format}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <CreditCard className="w-4 h-4 text-rola-gold flex-shrink-0" />
            <span>
              {event.entryFee && parseFloat(event.entryFee) > 0
                ? `$${event.entryFee} MXN`
                : 'Gratis'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rola-gold/10 rounded-lg">
              <Users className="w-5 h-5 text-rola-gold" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-xl font-bold text-white">{registrations.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Aprobados</p>
              <p className="text-xl font-bold text-white">
                {approvedCount}
                {event.maxPlayers ? `/${event.maxPlayers}` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Pendientes</p>
              <p className="text-xl font-bold text-white">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Rechazados</p>
              <p className="text-xl font-bold text-white">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Bar */}
      {event.maxPlayers && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Capacidad del evento</span>
            <span className="text-sm font-medium text-white">
              {approvedCount} / {event.maxPlayers} cupos
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                approvedCount >= event.maxPlayers
                  ? 'bg-red-500'
                  : approvedCount >= event.maxPlayers * 0.8
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min((approvedCount / event.maxPlayers) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all'
                ? 'bg-rola-gold text-rola-black'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Todos ({registrations.length})
          </button>
          <button
            onClick={() => setFilter('APROBADO')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'APROBADO'
                ? 'bg-green-500 text-white'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Aprobados ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('PENDIENTE')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'PENDIENTE'
                ? 'bg-yellow-500 text-white'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Pendientes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('RECHAZADO')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'RECHAZADO'
                ? 'bg-red-500 text-white'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Rechazados ({rejectedCount})
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o mazo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
          />
        </div>
      </div>

      {/* Registrations Table */}
      {filteredRegistrations.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {registrations.length === 0
              ? 'No hay inscripciones para este evento'
              : 'No se encontraron resultados con los filtros aplicados'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-rola-gray/30">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                      Jugador
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                      Mazo
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                      Pago
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                      Estado
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                      Fecha
                    </th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rola-gray/20">
                  {filteredRegistrations.map((reg) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-rola-gray/10 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{reg.User.name}</p>
                          <p className="text-xs text-gray-400">{reg.User.email}</p>
                          {reg.User.konamiId && (
                            <p className="text-xs text-gray-500">ID: {reg.User.konamiId}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">{reg.Deck.name}</p>
                          {reg.Deck.format && (
                            <p className="text-xs text-gray-400 capitalize">{reg.Deck.format}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className={`text-sm font-medium ${getPaymentColor(reg)}`}>
                            {getPaymentLabel(reg)}
                          </p>
                          {reg.transferReference && (
                            <p className="text-xs text-gray-500">Ref: {reg.transferReference}</p>
                          )}
                          {reg.paymentProof && (
                            <a
                              href={reg.paymentProof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-rola-gold hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              <FileText className="w-3 h-3" />
                              Ver comprobante
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            reg.status === 'APROBADO'
                              ? 'bg-green-500/10 text-green-500'
                              : reg.status === 'PENDIENTE'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          {reg.status === 'APROBADO' && <CheckCircle className="w-3 h-3" />}
                          {reg.status === 'PENDIENTE' && <Clock className="w-3 h-3" />}
                          {reg.status === 'RECHAZADO' && <XCircle className="w-3 h-3" />}
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-400">
                          {format(new Date(reg.createdAt), "d MMM yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(reg.createdAt), "HH:mm", { locale: es })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openModal(reg)}
                          className="btn btn-ghost btn-sm text-rola-gold"
                        >
                          <Eye className="w-4 h-4" />
                          Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRegistrations.map((reg) => (
              <div key={reg.id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{reg.User.name}</p>
                    <p className="text-xs text-gray-400">{reg.User.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      reg.status === 'APROBADO'
                        ? 'bg-green-500/10 text-green-500'
                        : reg.status === 'PENDIENTE'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {reg.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Mazo</p>
                    <p className="text-white font-medium">{reg.Deck.name}</p>
                    {reg.Deck.format && (
                      <p className="text-xs text-gray-400 capitalize">{reg.Deck.format}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pago</p>
                    <p className={`font-medium ${getPaymentColor(reg)}`}>
                      {getPaymentLabel(reg)}
                    </p>
                    {reg.transferReference && (
                      <p className="text-xs text-gray-500">Ref: {reg.transferReference}</p>
                    )}
                  </div>
                </div>

                {reg.paymentProof && (
                  <a
                    href={reg.paymentProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-rola-gold hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    Ver comprobante
                  </a>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-rola-gray/20">
                  <p className="text-xs text-gray-500">
                    {format(new Date(reg.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                  <button
                    onClick={() => openModal(reg)}
                    className="btn btn-ghost btn-sm text-rola-gold"
                  >
                    <Eye className="w-4 h-4" />
                    Detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showModal && selectedRegistration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={handleBackdropClick}
        >
          <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl font-bold text-white mb-6">
              Detalles de Inscripcion
            </h2>

            <div className="space-y-4 mb-6">
              {/* Player Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Jugador</p>
                  <p className="text-white font-medium">{selectedRegistration.User.name}</p>
                  <p className="text-gray-400 text-sm">{selectedRegistration.User.email}</p>
                  {selectedRegistration.User.konamiId && (
                    <p className="text-gray-500 text-xs mt-1">
                      Konami ID: {selectedRegistration.User.konamiId}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mazo</p>
                  <p className="text-white font-medium">{selectedRegistration.Deck.name}</p>
                  {selectedRegistration.Deck.format && (
                    <p className="text-gray-400 text-sm capitalize">
                      Formato: {selectedRegistration.Deck.format}
                    </p>
                  )}
                </div>
              </div>

              {/* Deck Cards Section */}
              {selectedRegistration.Deck.DeckCard && selectedRegistration.Deck.DeckCard.length > 0 && (
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Cartas del Mazo
                    <span className="text-xs text-gray-500">
                      ({selectedRegistration.Deck.DeckCard.reduce((acc, c) => acc + c.quantity, 0)} cartas)
                    </span>
                  </h4>

                  {/* Main Deck */}
                  {(() => {
                    const mainCards = selectedRegistration.Deck.DeckCard.filter(c => c.deckType === 'MAIN');
                    const mainCount = mainCards.reduce((acc, c) => acc + c.quantity, 0);
                    if (mainCards.length === 0) return null;
                    return (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">Main Deck ({mainCount})</p>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
                          {mainCards.map((card) => (
                            <div key={card.id} className="relative group" title={card.cardData?.name || 'Carta'}>
                              <div className="aspect-[59/86] rounded overflow-hidden border border-rola-gray/30">
                                {card.cardData?.card_images?.[0]?.image_url_small ? (
                                  <Image
                                    src={card.cardData.card_images[0].image_url_small}
                                    alt={card.cardData.name || 'Carta'}
                                    fill
                                    className="object-cover"
                                    sizes="50px"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">
                                    ?
                                  </div>
                                )}
                              </div>
                              {card.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-rola-gold text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {card.quantity}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Extra Deck */}
                  {(() => {
                    const extraCards = selectedRegistration.Deck.DeckCard.filter(c => c.deckType === 'EXTRA');
                    const extraCount = extraCards.reduce((acc, c) => acc + c.quantity, 0);
                    if (extraCards.length === 0) return null;
                    return (
                      <div className="mb-4">
                        <p className="text-xs text-rola-purple mb-2">Extra Deck ({extraCount})</p>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
                          {extraCards.map((card) => (
                            <div key={card.id} className="relative group" title={card.cardData?.name || 'Carta'}>
                              <div className="aspect-[59/86] rounded overflow-hidden border border-rola-purple/30">
                                {card.cardData?.card_images?.[0]?.image_url_small ? (
                                  <Image
                                    src={card.cardData.card_images[0].image_url_small}
                                    alt={card.cardData.name || 'Carta'}
                                    fill
                                    className="object-cover"
                                    sizes="50px"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">
                                    ?
                                  </div>
                                )}
                              </div>
                              {card.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-rola-purple text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {card.quantity}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Side Deck */}
                  {(() => {
                    const sideCards = selectedRegistration.Deck.DeckCard.filter(c => c.deckType === 'SIDE');
                    const sideCount = sideCards.reduce((acc, c) => acc + c.quantity, 0);
                    if (sideCards.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs text-rola-gold mb-2">Side Deck ({sideCount})</p>
                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1">
                          {sideCards.map((card) => (
                            <div key={card.id} className="relative group" title={card.cardData?.name || 'Carta'}>
                              <div className="aspect-[59/86] rounded overflow-hidden border border-rola-gold/30">
                                {card.cardData?.card_images?.[0]?.image_url_small ? (
                                  <Image
                                    src={card.cardData.card_images[0].image_url_small}
                                    alt={card.cardData.name || 'Carta'}
                                    fill
                                    className="object-cover"
                                    sizes="50px"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[8px] text-gray-500">
                                    ?
                                  </div>
                                )}
                              </div>
                              {card.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-rola-gold text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {card.quantity}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Payment Info */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Informacion de Pago
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Costo de inscripcion</p>
                    <p className="text-white font-medium">
                      {event.entryFee && parseFloat(event.entryFee) > 0
                        ? `$${event.entryFee} MXN`
                        : 'Gratis'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Estado del pago</p>
                    <p className={`font-medium ${getPaymentColor(selectedRegistration)}`}>
                      {getPaymentLabel(selectedRegistration)}
                    </p>
                  </div>
                  {selectedRegistration.transferReference && (
                    <div className="sm:col-span-2">
                      <p className="text-gray-500">Referencia de transferencia</p>
                      <p className="text-white font-medium">
                        {selectedRegistration.transferReference}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof */}
              {selectedRegistration.paymentProof && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Comprobante de Pago</p>
                  {selectedRegistration.paymentProofType?.startsWith('image/') ? (
                    <img
                      src={selectedRegistration.paymentProof}
                      alt="Comprobante"
                      className="max-w-full rounded-lg border border-gray-700"
                    />
                  ) : (
                    <a
                      href={selectedRegistration.paymentProof}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </a>
                  )}
                </div>
              )}

              {/* Upload Payment Proof (if none exists) */}
              {!selectedRegistration.paymentProof &&
                event.entryFee &&
                parseFloat(event.entryFee) > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      Subir Comprobante (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="payment-proof-upload"
                      />
                      <label
                        htmlFor="payment-proof-upload"
                        className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-600 hover:border-rola-gold rounded-lg cursor-pointer transition-all duration-200 group"
                      >
                        <Upload className="w-5 h-5 text-gray-400 group-hover:text-rola-gold transition-colors" />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {paymentProofFile
                            ? paymentProofFile.name
                            : 'Seleccionar archivo (JPG, PNG, WEBP, PDF)'}
                        </span>
                      </label>
                      {paymentProofFile && (
                        <p className="mt-2 text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Archivo seleccionado: {paymentProofFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {/* Rejection Note Input */}
              {selectedRegistration.status === 'PENDIENTE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Nota de Rechazo (si aplica)
                  </label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Escribe aqui la razon del rechazo (opcional)..."
                    className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-all duration-200 resize-none min-h-[100px]"
                    rows={3}
                  />
                  {rejectionNote.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Esta nota se enviara al usuario si se rechaza la solicitud
                    </p>
                  )}
                </div>
              )}

              {/* Existing Rejection Note */}
              {selectedRegistration.status === 'RECHAZADO' &&
                selectedRegistration.rejectionNote && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                    <p className="text-sm text-gray-500 mb-1">Motivo del rechazo:</p>
                    <p className="text-sm text-red-400">{selectedRegistration.rejectionNote}</p>
                  </div>
                )}

              {/* Registration Date */}
              <div className="text-sm text-gray-500">
                Inscrito el{' '}
                {format(new Date(selectedRegistration.createdAt), "d 'de' MMMM yyyy, HH:mm", {
                  locale: es,
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {selectedRegistration.status === 'PENDIENTE' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedRegistration.id, 'APROBADO')}
                    disabled={processingId !== null}
                    className="btn btn-primary flex-1"
                  >
                    {processingId === selectedRegistration.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedRegistration.id, 'RECHAZADO')}
                    disabled={processingId !== null}
                    className="btn bg-red-500 hover:bg-red-600 text-white flex-1"
                  >
                    {processingId === selectedRegistration.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Rechazar
                  </button>
                </>
              )}
              <button onClick={closeModal} className="btn btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
