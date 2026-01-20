'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface Deck {
  id: string;
  name: string;
  format: string | null;
  isActive: boolean;
  cards: {
    id: string;
  }[];
}

interface RegistrationFormProps {
  eventId: string;
  eventFormat: string | null;
  entryFee: string | null;
  maxPlayers: number | null;
  currentRegistrations: number;
  userId: string;
}

export default function RegistrationForm({
  eventId,
  eventFormat,
  entryFee,
  maxPlayers,
  currentRegistrations,
  userId,
}: RegistrationFormProps) {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transferReference, setTransferReference] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar si hay cupo disponible
  const hasSpace = maxPlayers ? currentRegistrations < maxPlayers : true;

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoadingDecks(true);
      const response = await fetch('/api/decks');
      if (!response.ok) throw new Error('Error al cargar mazos');

      const data = await response.json();

      // Filtrar mazos por formato si el evento tiene formato específico
      const filteredDecks = eventFormat
        ? data.decks.filter(
            (deck: Deck) => deck.format === eventFormat && deck.isActive
          )
        : data.decks.filter((deck: Deck) => deck.isActive);

      setDecks(filteredDecks);
    } catch (err) {
      setError('Error al cargar tus mazos. Por favor, recarga la página.');
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o PDF');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no debe superar los 5MB');
      return;
    }

    setPaymentProof(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (!selectedDeckId) {
        throw new Error('Debes seleccionar un mazo');
      }

      if (!hasSpace) {
        throw new Error('No hay cupo disponible para este evento');
      }

      // Crear FormData para enviar archivo
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('deckId', selectedDeckId);
      if (transferReference) {
        formData.append('transferReference', transferReference);
      }
      if (paymentProof) {
        formData.append('paymentProof', paymentProof);
      }

      const response = await fetch('/api/events/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrarse');
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="font-display text-2xl font-bold text-white mb-2">
          ¡Solicitud Enviada!
        </h3>
        <p className="text-gray-400">
          Tu solicitud de inscripción ha sido enviada. Recibirás una notificación
          una vez que sea revisada y aprobada.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <h3 className="font-display text-2xl font-bold text-white mb-6">
        Inscribirse al Evento
      </h3>

      {!hasSpace && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Sin cupo disponible</p>
              <p className="text-red-400 text-sm mt-1">
                Este evento ha alcanzado su capacidad máxima de jugadores.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Mazo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Selecciona tu Mazo {eventFormat && `(Formato: ${eventFormat})`}
          </label>
          {loadingDecks ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-rola-gold animate-spin" />
            </div>
          ) : decks.length === 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-500 text-sm">
                No tienes mazos disponibles
                {eventFormat && ` del formato ${eventFormat}`}. Por favor,{' '}
                <a href="/mazos/nuevo" className="underline hover:text-yellow-400">
                  crea un mazo
                </a>{' '}
                antes de inscribirte.
              </p>
            </div>
          ) : (
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="input-field"
              disabled={!hasSpace || loading}
              required
            >
              <option value="">Selecciona un mazo...</option>
              {decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.cards.length} cartas)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Información de Pago */}
        {entryFee && Number(entryFee) > 0 && (
          <div className="space-y-4 p-4 bg-rola-gray rounded-lg">
            <div>
              <h4 className="font-medium text-white mb-2">Información de Pago</h4>
              <p className="text-sm text-gray-400 mb-4">
                Realiza tu transferencia SPEI al siguiente número de cuenta:
              </p>
              <div className="bg-rola-black p-3 rounded-lg font-mono text-rola-gold text-center text-lg">
                012 180 0012 3456 7890
              </div>
              <p className="text-sm text-gray-400 mt-2 text-center">
                Monto: <span className="text-white font-bold">${entryFee} MXN</span>
              </p>
            </div>

            {/* Referencia de transferencia (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referencia de Transferencia (opcional)
              </label>
              <input
                type="text"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                placeholder="Ej: 123456789"
                className="input-field"
                disabled={!hasSpace || loading}
              />
            </div>

            {/* Comprobante de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comprobante de Pago (Opcional - puedes subirlo después)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="payment-proof"
                  disabled={!hasSpace || loading}
                />
                <label
                  htmlFor="payment-proof"
                  className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-rola-gray hover:border-rola-gold transition-colors rounded-lg cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    {paymentProof
                      ? paymentProof.name
                      : 'Selecciona un archivo (JPG, PNG o PDF)'}
                  </span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tamaño máximo: 5MB. También puedes enviar el comprobante por WhatsApp.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!hasSpace || loading || decks.length === 0}
          className="btn btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            'Enviar Solicitud de Inscripción'
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Tu solicitud será revisada por el staff. Recibirás una notificación una vez
          que sea aprobada.
        </p>
      </form>
    </div>
  );
}
