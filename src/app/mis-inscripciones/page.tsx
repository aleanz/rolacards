'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ArrowLeft,
  FileText,
  Upload,
  Layers,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import toast from 'react-hot-toast';

interface Registration {
  id: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
  rejectionNote: string | null;
  transferReference: string | null;
  paymentProof: string | null;
  event: {
    id: string;
    title: string;
    slug: string;
    date: string;
    format: string | null;
    entryFee: string | null;
    location: string | null;
  };
  deck: {
    id: string;
    name: string;
    format: string | null;
  };
}

export default function MisInscripcionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/mis-inscripciones');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchRegistrations();
    }
  }, [session]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events/my-registrations');
      if (!response.ok) throw new Error('Error al cargar inscripciones');

      const data = await response.json();
      setRegistrations(data.registrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDecks = async (format?: string) => {
    try {
      const response = await fetch('/api/decks');
      if (!response.ok) throw new Error('Error al cargar mazos');

      const data = await response.json();

      // Filtrar mazos activos por formato si se especifica
      const filteredDecks = format
        ? data.decks.filter((deck: any) => deck.format?.toLowerCase() === format.toLowerCase() && deck.isActive)
        : data.decks.filter((deck: any) => deck.isActive);

      setDecks(filteredDecks);
    } catch (error) {
      console.error('Error fetching decks:', error);
      toast.error('Error al cargar los mazos');
    }
  };

  const handleFileUpload = async (registrationId: string, file: File, transferReference?: string) => {
    try {
      setUploadingId(registrationId);

      const formData = new FormData();
      formData.append('paymentProof', file);
      if (transferReference) {
        formData.append('transferReference', transferReference);
      }

      const response = await fetch(`/api/events/my-registrations/${registrationId}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al subir comprobante');
      }

      toast.success('Comprobante de pago subido exitosamente');
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.message || 'Error al subir el comprobante');
    } finally {
      setUploadingId(null);
    }
  };

  const handleChangeDeck = async (registrationId: string, newDeckId: string) => {
    try {
      const formData = new FormData();
      formData.append('deckId', newDeckId);

      const response = await fetch(`/api/events/my-registrations/${registrationId}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar mazo');
      }

      toast.success('Mazo actualizado exitosamente');
      setEditingDeckId(null);
      setSelectedDeck('');
      fetchRegistrations();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar el mazo');
    }
  };

  if (status === 'loading' || !session) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20">
          <div className="container-custom">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-rola-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Mis Inscripciones
            </h1>
            <p className="text-xl text-gray-400">
              Revisa el estado de tus inscripciones a eventos y torneos
            </p>
          </div>

          {/* Registrations List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="card p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-white mb-2">
                No tienes inscripciones
              </h3>
              <p className="text-gray-400 mb-6">
                Aún no te has inscrito a ningún evento o torneo
              </p>
              <Link href="/#eventos" className="btn btn-primary inline-flex">
                Ver Eventos Disponibles
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {registrations.map((registration) => {
                const eventDate = new Date(registration.event.date);
                const isPast = eventDate < new Date();

                return (
                  <div key={registration.id} className="card p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <Link
                          href={`/eventos/${registration.event.slug}`}
                          className="font-display text-2xl font-bold text-white hover:text-rola-gold transition-colors"
                        >
                          {registration.event.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(eventDate, "d 'de' MMMM, yyyy", { locale: es })}
                          </div>
                          {registration.event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {registration.event.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                          registration.status === 'APROBADO'
                            ? 'bg-green-500/10 text-green-500'
                            : registration.status === 'PENDIENTE'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {registration.status === 'APROBADO' && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Aprobado
                          </div>
                        )}
                        {registration.status === 'PENDIENTE' && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pendiente
                          </div>
                        )}
                        {registration.status === 'RECHAZADO' && (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            Rechazado
                          </div>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Mazo */}
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500 mb-1">Mazo</p>
                        <div className="flex items-start gap-2">
                          <Layers className="w-4 h-4 text-rola-gold mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-white font-medium">{registration.deck.name}</p>
                            {registration.deck.format && (
                              <p className="text-xs text-gray-400">
                                Formato: {registration.deck.format}
                              </p>
                            )}
                            <Link
                              href={`/mazos/${registration.deck.id}`}
                              className="text-xs text-rola-gold hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              Ver mazo completo
                            </Link>
                          </div>
                        </div>
                        {!isPast && (
                          <button
                            onClick={() => {
                              setEditingDeckId(registration.id);
                              setSelectedDeck(registration.deck.id);
                              fetchDecks(registration.event.format || undefined);
                            }}
                            className="text-xs text-gray-400 hover:text-rola-gold inline-flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            Cambiar mazo
                          </button>
                        )}
                      </div>

                      {/* Precio */}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Precio</p>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-rola-gold" />
                          <p className="text-white font-medium">
                            {!registration.event.entryFee || Number(registration.event.entryFee) === 0
                              ? 'GRATIS'
                              : `$${registration.event.entryFee} MXN`}
                          </p>
                        </div>
                        {registration.transferReference && (
                          <p className="text-xs text-gray-400 mt-1">
                            Ref: {registration.transferReference}
                          </p>
                        )}
                      </div>

                      {/* Fecha de solicitud */}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Fecha de Solicitud</p>
                        <p className="text-white font-medium">
                          {format(new Date(registration.createdAt), 'd/MM/yyyy HH:mm', {
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Comprobante de pago */}
                    {registration.event.entryFee && Number(registration.event.entryFee) > 0 && (
                      <div className="mb-4 p-4 bg-rola-gray/30 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Comprobante de Pago</p>
                        {registration.paymentProof ? (
                          <a
                            href={registration.paymentProof}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-rola-gold hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            Ver comprobante adjunto
                          </a>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-yellow-400 text-sm mb-2">⚠️ No has subido comprobante de pago</p>
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(registration.id, file);
                                }
                              }}
                              className="hidden"
                              id={`payment-${registration.id}`}
                              disabled={uploadingId === registration.id}
                            />
                            <label
                              htmlFor={`payment-${registration.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-rola-gold text-rola-black rounded-lg hover:bg-rola-gold/90 transition-colors cursor-pointer text-sm font-medium"
                            >
                              {uploadingId === registration.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Subir comprobante
                                </>
                              )}
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Formatos: JPG, PNG, PDF (máx. 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cambiar mazo */}
                    {editingDeckId === registration.id && (
                      <div className="mb-4 p-4 bg-rola-gray/30 rounded-lg space-y-3">
                        <p className="text-sm text-white font-medium">Cambiar Mazo</p>
                        <select
                          value={selectedDeck}
                          onChange={(e) => setSelectedDeck(e.target.value)}
                          className="w-full px-4 py-3 bg-rola-black border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                        >
                          <option value="">Selecciona un mazo...</option>
                          {decks.map((deck) => (
                            <option key={deck.id} value={deck.id} className="bg-rola-black text-white">
                              {deck.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleChangeDeck(registration.id, selectedDeck)}
                            disabled={!selectedDeck || selectedDeck === registration.deck.id}
                            className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Confirmar cambio
                          </button>
                          <button
                            onClick={() => {
                              setEditingDeckId(null);
                              setSelectedDeck('');
                            }}
                            className="btn btn-ghost btn-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {registration.status === 'PENDIENTE' && (
                      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                        <p className="text-yellow-500 text-sm">
                          Tu solicitud está siendo revisada por el staff. Recibirás una
                          notificación una vez que sea procesada.
                        </p>
                      </div>
                    )}

                    {registration.status === 'RECHAZADO' && registration.rejectionNote && (
                      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                        <p className="text-red-500 font-medium text-sm mb-1">
                          Razón del rechazo:
                        </p>
                        <p className="text-red-400 text-sm">{registration.rejectionNote}</p>
                      </div>
                    )}

                    {registration.status === 'APROBADO' && !isPast && (
                      <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                        <p className="text-green-500 text-sm">
                          ¡Tu inscripción ha sido aprobada! Te esperamos en el evento.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
