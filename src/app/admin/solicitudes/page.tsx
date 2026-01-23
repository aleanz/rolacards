'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Upload,
  Download,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Registration {
  id: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
  updatedAt: string;
  transferReference: string | null;
  paymentProof: string | null;
  paymentProofType: string | null;
  rejectionNote: string | null;
  User: {
    id: string;
    name: string;
    email: string;
  };
  Event: {
    id: string;
    title: string;
    date: string;
    format: string | null;
    entryFee: string | null;
    maxPlayers: number | null;
    approvedCount: number;
  };
  Deck: {
    id: string;
    name: string;
    format: string | null;
  };
}

export default function SolicitudesPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>(
    'PENDIENTE'
  );
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const url =
        filter === 'all'
          ? '/api/admin/registrations'
          : `/api/admin/registrations?status=${filter}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar solicitudes');

      const data = await response.json();
      setRegistrations(data.registrations);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: 'APROBADO' | 'RECHAZADO'
  ) => {
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

      // Actualizar la lista
      await fetchRegistrations();
      setShowModal(false);
      setSelectedRegistration(null);
      setRejectionNote('');
      setPaymentProofFile(null);

      toast.success(status === 'APROBADO' ? 'Solicitud aprobada correctamente' : 'Solicitud rechazada');
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

  const filteredRegistrations =
    filter === 'all'
      ? registrations
      : registrations.filter((reg) => reg.status === filter);

  const pendingCount = registrations.filter(
    (reg) => reg.status === 'PENDIENTE'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">
          Solicitudes de Inscripción
        </h1>
        <p className="text-gray-400">
          Gestiona las solicitudes de inscripción a eventos y torneos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Aprobadas</p>
              <p className="text-2xl font-bold text-white">
                {registrations.filter((reg) => reg.status === 'APROBADO').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Rechazadas</p>
              <p className="text-2xl font-bold text-white">
                {registrations.filter((reg) => reg.status === 'RECHAZADO').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rola-gold/10 rounded-lg">
              <Users className="w-5 h-5 text-rola-gold" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{registrations.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('PENDIENTE')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'PENDIENTE'
                ? 'bg-yellow-500 text-white'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('APROBADO')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'APROBADO'
                ? 'bg-green-500 text-white'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Aprobadas
          </button>
          <button
            onClick={() => setFilter('RECHAZADO')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'RECHAZADO'
                ? 'bg-red-500 text-white'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Rechazadas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-rola-gold text-rola-black'
                : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/70'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No hay solicitudes en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => (
            <div key={registration.id} className="card p-6 hover:border-rola-gold/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {registration.Event.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {format(new Date(registration.Event.date), "d 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        registration.status === 'APROBADO'
                          ? 'bg-green-500/10 text-green-500'
                          : registration.status === 'PENDIENTE'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {registration.status}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Jugador</p>
                      <p className="text-white font-medium">{registration.User.name}</p>
                      <p className="text-gray-400 text-xs">{registration.User.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mazo</p>
                      <p className="text-white font-medium">{registration.Deck.name}</p>
                      {registration.Deck.format && (
                        <p className="text-gray-400 text-xs">
                          Formato: {registration.Deck.format}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">Entrada</p>
                      <p className="text-white font-medium">
                        {registration.Event.entryFee
                          ? `$${registration.Event.entryFee} MXN`
                          : 'Gratis'}
                      </p>
                      {registration.transferReference && (
                        <p className="text-gray-400 text-xs">
                          Ref: {registration.transferReference}
                        </p>
                      )}
                    </div>
                    {registration.Event.maxPlayers && (
                      <div>
                        <p className="text-gray-500">Cupos</p>
                        <p className="text-white font-medium">
                          {registration.Event.approvedCount} / {registration.Event.maxPlayers}
                        </p>
                        <p className={`text-xs ${
                          registration.Event.approvedCount >= registration.Event.maxPlayers
                            ? 'text-red-400'
                            : registration.Event.approvedCount >= registration.Event.maxPlayers * 0.8
                            ? 'text-yellow-400'
                            : 'text-green-400'
                        }`}>
                          {registration.Event.approvedCount >= registration.Event.maxPlayers
                            ? 'Lleno'
                            : `${registration.Event.maxPlayers - registration.Event.approvedCount} disponibles`
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Proof */}
                  {registration.paymentProof && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-rola-gold" />
                      <a
                        href={registration.paymentProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rola-gold hover:underline"
                      >
                        Ver comprobante de pago
                      </a>
                    </div>
                  )}

                  {/* Rejection Note */}
                  {registration.status === 'RECHAZADO' && registration.rejectionNote && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                      <p className="text-sm text-red-400">{registration.rejectionNote}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => openModal(registration)}
                    className="btn btn-secondary text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-2xl font-bold text-white mb-6">
              Detalles de la Solicitud
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Evento</p>
                <p className="text-white font-medium">{selectedRegistration.Event.title}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Jugador</p>
                <p className="text-white font-medium">{selectedRegistration.User.name}</p>
                <p className="text-gray-400 text-sm">{selectedRegistration.User.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Mazo</p>
                <p className="text-white font-medium">{selectedRegistration.Deck.name}</p>
              </div>

              {selectedRegistration.paymentProof && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Comprobante de Pago</p>
                  {selectedRegistration.paymentProofType?.startsWith('image/') ? (
                    <img
                      src={selectedRegistration.paymentProof}
                      alt="Comprobante"
                      className="max-w-full rounded-lg"
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

              {!selectedRegistration.paymentProof && (
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
                      className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-gray-600 hover:border-primary-500 rounded-lg cursor-pointer transition-all duration-200 group"
                    >
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                        {paymentProofFile ? paymentProofFile.name : 'Seleccionar archivo (JPG, PNG, WEBP, PDF)'}
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

              {selectedRegistration.status === 'PENDIENTE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Nota de Rechazo (si aplica)
                  </label>
                  <div className="relative">
                    <textarea
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Escribe aquí la razón del rechazo (opcional)..."
                      className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 resize-none min-h-[120px]"
                      rows={4}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                      {rejectionNote.length} caracteres
                    </div>
                  </div>
                  {rejectionNote.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Esta nota se enviará al usuario si se rechaza la solicitud
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {selectedRegistration.status === 'PENDIENTE' && (
                <>
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedRegistration.id, 'APROBADO')
                    }
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
                    onClick={() =>
                      handleUpdateStatus(selectedRegistration.id, 'RECHAZADO')
                    }
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
