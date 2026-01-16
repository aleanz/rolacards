'use client';

import { countCardsByType } from '@/lib/deck-validation';
import type { DeckCard } from '@/lib/deck-validation';

interface DeckStatsProps {
  cards: DeckCard[];
}

export default function DeckStats({ cards }: DeckStatsProps) {
  const counts = countCardsByType(cards);

  // Calculate card type distribution
  const typeDistribution: Record<string, number> = {};
  const attributeDistribution: Record<string, number> = {};
  const levelDistribution: Record<string, number> = {};

  cards.forEach(card => {
    if (!card.cardData) return;

    // Card type
    const type = card.cardData.type || 'Unknown';
    typeDistribution[type] = (typeDistribution[type] || 0) + card.quantity;

    // Attribute (for monsters)
    if (card.cardData.attribute) {
      const attr = card.cardData.attribute;
      attributeDistribution[attr] = (attributeDistribution[attr] || 0) + card.quantity;
    }

    // Level/Rank (for monsters)
    if (card.cardData.level) {
      const level = `Level ${card.cardData.level}`;
      levelDistribution[level] = (levelDistribution[level] || 0) + card.quantity;
    }
  });

  return (
    <div className="card p-6">
      <h3 className="font-display text-lg font-bold text-white mb-4">
        Estadísticas del Mazo
      </h3>

      {/* Card counts */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-rola-gray/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{counts.main}</p>
          <p className="text-xs text-gray-400">Main Deck</p>
        </div>
        <div className="bg-rola-gray/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-rola-purple">{counts.extra}</p>
          <p className="text-xs text-gray-400">Extra Deck</p>
        </div>
        <div className="bg-rola-gray/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-rola-gold">{counts.side}</p>
          <p className="text-xs text-gray-400">Side Deck</p>
        </div>
      </div>

      {/* Card types */}
      {Object.keys(typeDistribution).length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-400 mb-2">Por tipo</p>
          <div className="space-y-2">
            {Object.entries(typeDistribution)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-rola-gray/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rola-gold"
                        style={{
                          width: `${(count / (counts.main + counts.extra + counts.side)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Attributes */}
      {Object.keys(attributeDistribution).length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-400 mb-2">Por atributo</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(attributeDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([attr, count]) => (
                <div
                  key={attr}
                  className="px-2 py-1 bg-rola-gray/30 rounded text-xs text-gray-300"
                >
                  {attr}: {count}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
