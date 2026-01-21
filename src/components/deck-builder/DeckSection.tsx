'use client';

import { Plus } from 'lucide-react';
import CardInDeck from './CardInDeck';
import type { DeckCard } from '@/lib/deck-validation';

interface DeckSectionProps {
  type: 'MAIN' | 'EXTRA' | 'SIDE';
  cards: DeckCard[];
  maxCards: number;
  format?: string;
  allCards: DeckCard[];
  onAddCard: () => void;
  onRemove: (cardId: number) => void;
  onQuantityChange: (cardId: number, newQuantity: number) => void;
}

const sectionInfo = {
  MAIN: {
    title: 'Main Deck',
    color: 'text-white',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    min: 40,
    max: 60,
  },
  EXTRA: {
    title: 'Extra Deck',
    color: 'text-rola-purple',
    bgColor: 'bg-rola-purple/10 border-rola-purple/30',
    min: 0,
    max: 15,
  },
  SIDE: {
    title: 'Side Deck',
    color: 'text-rola-gold',
    bgColor: 'bg-rola-gold/10 border-rola-gold/30',
    min: 0,
    max: 15,
  },
};

export default function DeckSection({
  type,
  cards,
  maxCards,
  format,
  allCards,
  onAddCard,
  onRemove,
  onQuantityChange,
}: DeckSectionProps) {
  const info = sectionInfo[type];
  const cardCount = cards.reduce((sum, card) => sum + card.quantity, 0);
  const isAtMax = cardCount >= maxCards;
  const isValid = type === 'MAIN' ? cardCount >= info.min && cardCount <= info.max : cardCount <= info.max;

  return (
    <div className={`border rounded-lg p-3 md:p-4 ${info.bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className={`font-display text-base md:text-lg font-bold ${info.color}`}>
            {info.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-400 truncate">
            {cardCount} / {type === 'MAIN' ? `${info.min}-${info.max}` : info.max} cartas
            {!isValid && type === 'MAIN' && cardCount < info.min && (
              <span className="text-red-400 ml-1 md:ml-2">
                (Mín {info.min})
              </span>
            )}
            {!isValid && cardCount > info.max && (
              <span className="text-red-400 ml-1 md:ml-2">
                (Máx {info.max})
              </span>
            )}
          </p>
        </div>

        <button
          onClick={onAddCard}
          disabled={isAtMax}
          className="btn btn-sm btn-outline disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agregar</span>
        </button>
      </div>

      {/* Cards List */}
      {cards.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {cards.map(card => (
            <CardInDeck
              key={`${card.id}-${card.cardId}`}
              card={card}
              deckType={type}
              format={format}
              allCards={allCards}
              onQuantityChange={onQuantityChange}
              onRemove={onRemove}
              maxQuantity={3}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          <p className="text-sm">No hay cartas en este mazo</p>
          <p className="text-xs mt-1">Haz clic en "Agregar" para buscar cartas</p>
        </div>
      )}
    </div>
  );
}
