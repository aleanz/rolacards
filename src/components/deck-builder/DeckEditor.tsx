'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save, Loader2, AlertTriangle, X } from 'lucide-react';
import DeckSection from './DeckSection';
import CardSearch from './CardSearch';
import DeckValidation from './DeckValidation';
import DeckStats from './DeckStats';
import { validateDeck, canAddCard, getRemainingSlots } from '@/lib/deck-validation';
import type { Deck, DeckCard } from '@/lib/deck-validation';
import type { YGOCard } from '@/lib/ygoprodeck';
import { getBanlistStatus, getMaxCopies, isCardLegalByDate, type Format } from '@/lib/banlist';

interface DeckEditorProps {
  deckId?: string;
  initialDeck?: Deck;
  onSave: (deck: Deck) => Promise<void>;
}

export default function DeckEditor({ deckId, initialDeck, onSave }: DeckEditorProps) {
  const [name, setName] = useState(initialDeck?.name || '');
  const [description, setDescription] = useState(initialDeck?.description || '');
  const [format, setFormat] = useState(initialDeck?.format || '');
  const [cards, setCards] = useState<DeckCard[]>(initialDeck?.cards || []);
  const [activeSection, setActiveSection] = useState<'MAIN' | 'EXTRA' | 'SIDE' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showFormatChangeModal, setShowFormatChangeModal] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<string>('');
  const [formatChangePreview, setFormatChangePreview] = useState<{
    toRemove: DeckCard[];
    toKeep: DeckCard[];
  } | null>(null);

  const validation = validateDeck({ id: deckId, name, description, format, cards });

  const mainCards = cards.filter(c => c.deckType === 'MAIN');
  const extraCards = cards.filter(c => c.deckType === 'EXTRA');
  const sideCards = cards.filter(c => c.deckType === 'SIDE');

  // Cerrar modal de formato con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFormatChangeModal) {
        cancelFormatChange();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showFormatChangeModal]);

  // Calcula qué cartas se deben eliminar al cambiar de formato
  const calculateFormatChange = (newFormat: string) => {
    if (!newFormat || cards.length === 0) {
      return { toRemove: [], toKeep: cards };
    }

    const validFormats = ['TCG', 'OCG', 'GOAT', 'Edison', 'Genesys'];
    const banlistFormat: Format = validFormats.includes(newFormat) ? (newFormat as Format) : 'TCG';
    const toRemove: DeckCard[] = [];
    const toKeep: DeckCard[] = [];

    for (const card of cards) {
      // Check date legality first (for GOAT/Edison)
      const isDateLegal = isCardLegalByDate(card.cardData, banlistFormat);

      // If card didn't exist in the format, remove it
      if (!isDateLegal) {
        toRemove.push(card);
        continue;
      }

      // Check banlist status
      const status = getBanlistStatus(card.cardData, banlistFormat);
      const maxCopies = getMaxCopies(status);

      // Si la carta está prohibida en el nuevo formato, se elimina
      if (maxCopies === 0) {
        toRemove.push(card);
      } else {
        toKeep.push(card);
      }
    }

    return { toRemove, toKeep };
  };

  // Maneja el cambio de formato con confirmación
  const handleFormatChange = (newFormat: string) => {
    // Si no hay cartas, cambiar directamente
    if (cards.length === 0) {
      setFormat(newFormat);
      return;
    }

    // Si hay cartas, mostrar modal de confirmación
    const preview = calculateFormatChange(newFormat);
    setPendingFormat(newFormat);
    setFormatChangePreview(preview);
    setShowFormatChangeModal(true);
  };

  // Refresca los datos de las cartas para formato Genesys
  const refreshCardsForGenesys = async (cardsToRefresh: DeckCard[]) => {
    const updatedCards: DeckCard[] = [];

    for (const card of cardsToRefresh) {
      try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${card.cardId}&format=genesys&misc=yes`);
        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data[0]) {
            updatedCards.push({
              ...card,
              cardData: data.data[0],
            });
          } else {
            updatedCards.push(card);
          }
        } else {
          updatedCards.push(card);
        }
      } catch (error) {
        console.error('Error refreshing card data:', error);
        updatedCards.push(card);
      }
    }

    return updatedCards;
  };

  // Confirma el cambio de formato y aplica los cambios
  const confirmFormatChange = async () => {
    if (formatChangePreview) {
      let finalCards = formatChangePreview.toKeep;

      // Si cambiamos a Genesys, refrescar datos de cartas para obtener puntos
      if (pendingFormat === 'Genesys' && finalCards.length > 0) {
        finalCards = await refreshCardsForGenesys(finalCards);
      }

      setCards(finalCards);
      setFormat(pendingFormat);
    }
    setShowFormatChangeModal(false);
    setFormatChangePreview(null);
    setPendingFormat('');
  };

  // Cancela el cambio de formato
  const cancelFormatChange = () => {
    setShowFormatChangeModal(false);
    setFormatChangePreview(null);
    setPendingFormat('');
  };

  const handleAddCard = (card: YGOCard) => {
    if (!activeSection) return;

    // Check if we can add this card
    const canAdd = canAddCard({ id: deckId, name, description, format, cards }, card.id, activeSection);

    if (!canAdd && activeSection !== 'EXTRA') {
      toast.error('Ya tienes 3 copias de esta carta en Main + Side Deck');
      return;
    }

    // Check remaining slots
    const remaining = getRemainingSlots(cards, activeSection);
    if (remaining === 0) {
      toast.error(`El ${activeSection} Deck ya está lleno`);
      return;
    }

    // Check if card already exists in this deck type
    const existingCard = cards.find(c => c.cardId === card.id && c.deckType === activeSection);

    if (existingCard) {
      // Increase quantity (máximo 3 para todos los deck types)
      setCards(cards.map(c =>
        c.cardId === card.id && c.deckType === activeSection
          ? { ...c, quantity: Math.min(c.quantity + 1, 3) }
          : c
      ));
    } else {
      // Add new card
      const newCard: DeckCard = {
        id: `temp-${Date.now()}-${card.id}`,
        cardId: card.id,
        quantity: 1,
        deckType: activeSection,
        cardData: card,
      };
      setCards([...cards, newCard]);
    }
  };

  const handleRemoveCard = (deckType: 'MAIN' | 'EXTRA' | 'SIDE') => (cardId: number) => {
    setCards(cards.filter(c => !(c.cardId === cardId && c.deckType === deckType)));
  };

  const handleRemoveOneCard = (cardId: number) => {
    if (!activeSection) return;
    const existing = cards.find(c => c.cardId === cardId && c.deckType === activeSection);
    if (!existing) return;

    if (existing.quantity <= 1) {
      setCards(cards.filter(c => !(c.cardId === cardId && c.deckType === activeSection)));
    } else {
      setCards(cards.map(c =>
        c.cardId === cardId && c.deckType === activeSection
          ? { ...c, quantity: c.quantity - 1 }
          : c
      ));
    }
  };

  const handleQuantityChange = (deckType: 'MAIN' | 'EXTRA' | 'SIDE') => (cardId: number, newQuantity: number) => {
    setCards(cards.map(c =>
      c.cardId === cardId && c.deckType === deckType
        ? { ...c, quantity: newQuantity }
        : c
    ));
  };

  const handleSave = async () => {
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => e.message).join('\n• ');
      toast.error(`El mazo tiene errores:\n\n• ${errorMessages}\n\nPor favor corrígelos antes de guardar.`, {
        duration: 6000,
      });
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      await onSave({ id: deckId, name, description, format, cards });
      toast.success('Mazo guardado correctamente');
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setSaveError(`Error al guardar el mazo: ${errorMessage}`);
      toast.error(`Error al guardar el mazo: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Deck Info */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Información del Mazo
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Mazo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Ej: Blue-Eyes Chaos MAX"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Formato *
            </label>
            <select
              value={format}
              onChange={(e) => handleFormatChange(e.target.value)}
              className="input w-full"
            >
              <option value="">Seleccionar formato</option>
              <option value="TCG">TCG (Modern)</option>
              <option value="OCG">OCG (Modern)</option>
              <option value="GOAT">GOAT Format (2005)</option>
              <option value="Edison">Edison Format (2010)</option>
              <option value="Genesys">Genesys (Sistema de Puntos)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Selecciona un formato antes de agregar cartas
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full"
              placeholder="Descripción opcional de tu mazo..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Deck Builder */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6 min-w-0">
          {/* Main Deck */}
          <DeckSection
            type="MAIN"
            cards={mainCards}
            maxCards={60}
            format={format}
            allCards={cards}
            onAddCard={() => {
              if (!format) {
                toast.error('Por favor selecciona un formato (TCG/OCG) antes de agregar cartas.');
                return;
              }
              setActiveSection('MAIN');
            }}
            onRemove={handleRemoveCard('MAIN')}
            onQuantityChange={handleQuantityChange('MAIN')}
          />

          {/* Extra Deck */}
          <DeckSection
            type="EXTRA"
            cards={extraCards}
            maxCards={15}
            format={format}
            allCards={cards}
            onAddCard={() => {
              if (!format) {
                alert('Por favor selecciona un formato (TCG/OCG) antes de agregar cartas.');
                return;
              }
              setActiveSection('EXTRA');
            }}
            onRemove={handleRemoveCard('EXTRA')}
            onQuantityChange={handleQuantityChange('EXTRA')}
          />

          {/* Side Deck */}
          <DeckSection
            type="SIDE"
            cards={sideCards}
            maxCards={15}
            format={format}
            allCards={cards}
            onAddCard={() => {
              if (!format) {
                alert('Por favor selecciona un formato (TCG/OCG) antes de agregar cartas.');
                return;
              }
              setActiveSection('SIDE');
            }}
            onRemove={handleRemoveCard('SIDE')}
            onQuantityChange={handleQuantityChange('SIDE')}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4 md:space-y-6">
          {/* Stats */}
          <DeckStats
            cards={cards}
            format={format}
            onRefreshGenesysData={setCards}
          />

          {/* Validation */}
          <DeckValidation validationResult={validation} />

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!validation.valid || isSaving || !name.trim()}
            className="btn btn-primary w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Mazo
              </>
            )}
          </button>

          {saveError && (
            <p className="text-sm text-red-400 text-center">{saveError}</p>
          )}
        </div>
      </div>

      {/* Card Search Modal */}
      {activeSection && (
        <CardSearch
          deckType={activeSection}
          format={format}
          currentCards={cards}
          onCardSelect={handleAddCard}
          onCardRemove={handleRemoveOneCard}
          onClose={() => setActiveSection(null)}
        />
      )}

      {/* Format Change Confirmation Modal */}
      {showFormatChangeModal && formatChangePreview && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              cancelFormatChange();
            }
          }}
        >
          <div className="bg-rola-black border border-rola-gray rounded-xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-rola-gray flex items-center justify-between bg-orange-500/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Cambio de Formato
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    De {format || 'Sin formato'} a {pendingFormat}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelFormatChange}
                className="p-2 hover:bg-rola-gray/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Al cambiar el formato, algunas cartas pueden estar prohibidas en el nuevo formato.
              </p>

              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Cards to Keep */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <span className="text-2xl">✓</span>
                    Se Mantendrán
                  </h4>
                  <p className="text-2xl font-bold text-white mb-2">
                    {formatChangePreview.toKeep.reduce((sum, card) => sum + card.quantity, 0)} cartas
                  </p>
                  <p className="text-sm text-gray-400">
                    Válidas en {pendingFormat}
                  </p>
                </div>

                {/* Cards to Remove */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                    <span className="text-2xl">✕</span>
                    Se Eliminarán
                  </h4>
                  <p className="text-2xl font-bold text-white mb-2">
                    {formatChangePreview.toRemove.reduce((sum, card) => sum + card.quantity, 0)} cartas
                  </p>
                  <p className="text-sm text-gray-400">
                    Prohibidas en {pendingFormat}
                  </p>
                </div>
              </div>

              {/* List of cards to remove */}
              {formatChangePreview.toRemove.length > 0 && (
                <div className="bg-rola-gray/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h4 className="font-semibold text-red-400 mb-3">
                    Cartas que serán eliminadas:
                  </h4>
                  <ul className="space-y-2">
                    {formatChangePreview.toRemove.map((card, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          {card.quantity}x {card.cardData?.name || 'Unknown Card'}
                        </span>
                        <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
                          Prohibida en {pendingFormat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formatChangePreview.toRemove.length === 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-semibold">
                    🎉 ¡Todas tus cartas son válidas en {pendingFormat}!
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    No se eliminará ninguna carta
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-rola-gray flex gap-3">
              <button
                onClick={cancelFormatChange}
                className="btn btn-ghost flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={confirmFormatChange}
                className="btn btn-primary flex-1"
              >
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
