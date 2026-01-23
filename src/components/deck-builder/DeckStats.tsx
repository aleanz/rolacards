'use client';

import { useState } from 'react';
import { countCardsByType } from '@/lib/deck-validation';
import { calculateGenesysPoints } from '@/lib/banlist';
import type { DeckCard } from '@/lib/deck-validation';
import { RefreshCw } from 'lucide-react';

interface DeckStatsProps {
  cards: DeckCard[];
  format?: string;
  onRefreshGenesysData?: (updatedCards: DeckCard[]) => void;
}

export default function DeckStats({ cards, format, onRefreshGenesysData }: DeckStatsProps) {
  const counts = countCardsByType(cards);
  const genesysPoints = format === 'Genesys' ? calculateGenesysPoints(cards) : 0;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshGenesysData = async () => {
    if (!onRefreshGenesysData || cards.length === 0) return;

    setIsRefreshing(true);
    try {
      const updatedCards: DeckCard[] = [];

      for (const card of cards) {
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
          console.error('Error refreshing card:', card.cardId, error);
          updatedCards.push(card);
        }
      }

      onRefreshGenesysData(updatedCards);
    } finally {
      setIsRefreshing(false);
    }
  };

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

      {/* Genesys Points (if format is Genesys) */}
      {format === 'Genesys' && (
        <div className="mb-6 bg-gradient-to-r from-rola-purple/20 to-rola-gold/20 rounded-lg p-4 border border-rola-gold/30">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Puntos Genesys</p>
              <p className="text-xs text-gray-500">Límite estándar: 100</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-bold ${genesysPoints > 100 ? 'text-red-400' : 'text-rola-gold'}`}>
                {genesysPoints}
              </p>
              <p className="text-xs text-gray-400">/ 100</p>
            </div>
          </div>
          {genesysPoints === 0 && cards.length > 0 && (
            <button
              onClick={handleRefreshGenesysData}
              disabled={isRefreshing}
              className="w-full mt-2 px-3 py-2 bg-rola-gold/10 hover:bg-rola-gold/20 border border-rola-gold/30 rounded-lg text-xs text-rola-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando puntos...' : 'Actualizar puntos Genesys'}
            </button>
          )}
          {genesysPoints > 100 && (
            <p className="text-xs text-red-400 mt-2">
              ⚠️ El mazo excede el límite de puntos estándar
            </p>
          )}
        </div>
      )}

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
