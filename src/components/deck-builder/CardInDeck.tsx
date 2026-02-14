'use client';

import Image from 'next/image';
import { Plus, Minus, X } from 'lucide-react';
import type { DeckCard } from '@/lib/deck-validation';
import { getBanlistStatus, getMaxCopies, getGenesysPoints, type Format } from '@/lib/banlist';
import { Tooltip } from '@/components/ui/Tooltip';

interface CardInDeckProps {
  card: DeckCard;
  deckType: 'MAIN' | 'EXTRA' | 'SIDE';
  format?: string;
  allCards: DeckCard[];
  onQuantityChange: (cardId: number, newQuantity: number) => void;
  onRemove: (cardId: number) => void;
  maxQuantity?: number;
}

export default function CardInDeck({
  card,
  deckType,
  format,
  allCards,
  onQuantityChange,
  onRemove,
  maxQuantity = 3,
}: CardInDeckProps) {
  const cardData = card.cardData;

  // Calcular el máximo permitido según banlist
  const getEffectiveMaxQuantity = (): number => {
    // Si no hay formato, usar el máximo estándar
    if (!format) {
      return maxQuantity;
    }

    const validFormats = ['TCG', 'OCG', 'GOAT', 'Edison', 'Genesys'];
    const banlistFormat: Format = validFormats.includes(format) ? (format as Format) : 'TCG';

    // Obtener límite de banlist
    const status = getBanlistStatus(cardData, banlistFormat);
    const banlistMax = getMaxCopies(status);

    // Para Extra Deck, el límite es según banlist (igual que Main/Side)
    if (deckType === 'EXTRA') {
      return Math.min(maxQuantity, banlistMax);
    }

    // Para Main y Side Deck, contar copias actuales en Main + Side
    let currentCopies = 0;
    for (const c of allCards) {
      if (c.cardId === card.cardId && (c.deckType === 'MAIN' || c.deckType === 'SIDE')) {
        currentCopies += c.quantity;
      }
    }

    // El máximo efectivo es el límite de banlist menos las copias actuales + la cantidad de esta carta
    const effectiveMax = Math.min(maxQuantity, banlistMax - currentCopies + card.quantity);

    return Math.max(1, effectiveMax); // Al menos 1 (la carta actual)
  };

  const effectiveMax = getEffectiveMaxQuantity();
  const genesysPoints = format === 'Genesys' ? getGenesysPoints(cardData) : 0;
  const showGenesysPoints = format === 'Genesys' && genesysPoints > 0;

  const handleIncrease = () => {
    if (card.quantity < effectiveMax) {
      onQuantityChange(card.cardId, card.quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (card.quantity > 1) {
      onQuantityChange(card.cardId, card.quantity - 1);
    } else {
      // If quantity is 1 and decreasing, remove the card
      onRemove(card.cardId);
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3 p-2 bg-rola-gray/20 rounded-lg hover:bg-rola-gray/30 transition-colors group">
      {/* Card Image */}
      <div className="relative w-10 h-14 md:w-12 md:h-16 flex-shrink-0 rounded overflow-hidden">
        {cardData?.card_images?.[0]?.image_url ? (
          <Image
            src={cardData.card_images[0].image_url}
            alt={cardData.name || 'Card'}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-rola-gray/50 flex items-center justify-center">
            <span className="text-xs text-gray-500">?</span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs md:text-sm font-medium text-white truncate">
          {cardData?.name || 'Unknown Card'}
        </p>
        <p className="text-[10px] md:text-xs text-gray-400 truncate">
          {cardData?.type || 'Unknown Type'}
        </p>
        {showGenesysPoints && (
          <p className="text-[10px] md:text-xs text-rola-gold font-semibold">
            {genesysPoints} {genesysPoints === 1 ? 'punto' : 'puntos'}
          </p>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <button
          onClick={handleDecrease}
          className="w-6 h-6 rounded bg-rola-gray/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors flex items-center justify-center"
          aria-label="Decrease quantity"
        >
          <Minus className="w-3 h-3" />
        </button>

        <span className="text-sm font-medium text-white w-4 md:w-6 text-center">
          {card.quantity}
        </span>

        <Tooltip content={card.quantity >= effectiveMax ? 'Límite alcanzado (banlist)' : 'Aumentar cantidad'}>
          <button
            onClick={handleIncrease}
            disabled={card.quantity >= effectiveMax}
            className="w-6 h-6 rounded bg-rola-gray/50 hover:bg-rola-gold/20 text-gray-400 hover:text-rola-gold transition-colors flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </Tooltip>

        <button
          onClick={() => onRemove(card.cardId)}
          className="w-6 h-6 rounded bg-rola-gray/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors items-center justify-center ml-0.5 md:ml-1 hidden md:flex md:opacity-0 md:group-hover:opacity-100"
          aria-label="Remove card"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
