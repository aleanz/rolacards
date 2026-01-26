// Deck validation library for Yu-Gi-Oh deck builder

export interface DeckCard {
  id: string;
  cardId: number;
  quantity: number;
  deckType: 'MAIN' | 'EXTRA' | 'SIDE';
  cardData: any; // YGOProDeck card data
}

export interface Deck {
  id?: string;
  name: string;
  description?: string;
  format?: string;
  cards: DeckCard[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DeckValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// Card type keywords that identify Extra Deck monsters
const EXTRA_DECK_KEYWORDS = ['Fusion', 'Synchro', 'XYZ', 'Link'];

/**
 * Checks if a card is an Extra Deck monster
 * Handles cases like:
 * - "Fusion Monster"
 * - "Pendulum Effect Fusion Monster"
 * - "XYZ Pendulum Effect Monster"
 * - "Synchro Monster"
 * - "Link Monster"
 */
function isExtraDeckMonster(cardType: string): boolean {
  // Check if the card type contains any of the Extra Deck keywords
  // and also contains "Monster" (to avoid matching Spell/Trap cards)
  return EXTRA_DECK_KEYWORDS.some(keyword =>
    cardType.includes(keyword) && cardType.includes('Monster')
  );
}

/**
 * Validates that a card can be placed in the specified deck type
 */
export function validateDeckCard(cardData: any, deckType: 'MAIN' | 'EXTRA' | 'SIDE'): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!cardData) {
    errors.push({
      field: 'cardData',
      message: 'Card data is required',
      severity: 'error',
    });
    return errors;
  }

  const cardType = cardData.type;
  const isExtraDeck = isExtraDeckMonster(cardType);

  // Extra Deck can only contain specific card types
  if (deckType === 'EXTRA') {
    if (!isExtraDeck) {
      errors.push({
        field: 'deckType',
        message: `${cardData.name} (${cardType}) cannot be placed in Extra Deck. Only Fusion, Synchro, XYZ, and Link monsters are allowed.`,
        severity: 'error',
      });
    }
  }

  // Main Deck cannot contain Extra Deck monsters
  // Side Deck can contain any card type (Main Deck or Extra Deck monsters)
  if (deckType === 'MAIN') {
    if (isExtraDeck) {
      errors.push({
        field: 'deckType',
        message: `${cardData.name} (${cardType}) must be placed in Extra Deck.`,
        severity: 'error',
      });
    }
  }

  return errors;
}

/**
 * Counts total copies of a card across Main Deck, Extra Deck and Side Deck
 */
export function countCardCopies(deck: Deck, cardId: number): number {
  let count = 0;

  for (const card of deck.cards) {
    if (card.cardId === cardId) {
      count += card.quantity;
    }
  }

  return count;
}

/**
 * Counts cards by deck type
 */
export function countCardsByType(cards: DeckCard[]): { main: number; extra: number; side: number } {
  const counts = { main: 0, extra: 0, side: 0 };

  for (const card of cards) {
    if (card.deckType === 'MAIN') {
      counts.main += card.quantity;
    } else if (card.deckType === 'EXTRA') {
      counts.extra += card.quantity;
    } else if (card.deckType === 'SIDE') {
      counts.side += card.quantity;
    }
  }

  return counts;
}

/**
 * Validates complete deck structure
 */
export function validateDeck(deck: Deck): DeckValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate deck name
  if (!deck.name || deck.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'El nombre del mazo es requerido',
      severity: 'error',
    });
  }

  if (deck.name && deck.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'El nombre del mazo debe tener 100 caracteres o menos',
      severity: 'error',
    });
  }

  // Count cards by type
  const counts = countCardsByType(deck.cards);

  // Validate Main Deck (40-60 cards)
  if (counts.main < 40) {
    errors.push({
      field: 'mainDeck',
      message: `El Main Deck debe tener al menos 40 cartas (actualmente ${counts.main})`,
      severity: 'error',
    });
  } else if (counts.main > 60) {
    errors.push({
      field: 'mainDeck',
      message: `El Main Deck no puede exceder 60 cartas (actualmente ${counts.main})`,
      severity: 'error',
    });
  }

  // Validate Extra Deck (max 15)
  if (counts.extra > 15) {
    errors.push({
      field: 'extraDeck',
      message: `El Extra Deck no puede exceder 15 cartas (actualmente ${counts.extra})`,
      severity: 'error',
    });
  }

  // Validate Side Deck (max 15)
  if (counts.side > 15) {
    errors.push({
      field: 'sideDeck',
      message: `El Side Deck no puede exceder 15 cartas (actualmente ${counts.side})`,
      severity: 'error',
    });
  }

  // Validate each card placement
  for (const card of deck.cards) {
    const cardErrors = validateDeckCard(card.cardData, card.deckType);
    errors.push(...cardErrors);
  }

  // Validate card copy limits (max 3 copies per card across all decks)
  const cardCopyMap = new Map<number, number>();

  for (const card of deck.cards) {
    const currentCount = cardCopyMap.get(card.cardId) || 0;
    cardCopyMap.set(card.cardId, currentCount + card.quantity);
  }

  cardCopyMap.forEach((count, cardId) => {
    if (count > 3) {
      const cardName = deck.cards.find(c => c.cardId === cardId)?.cardData?.name || `Carta ID ${cardId}`;
      errors.push({
        field: 'cardCopies',
        message: `${cardName} tiene ${count} copias en el mazo. El máximo es 3 copias por carta.`,
        severity: 'error',
      });
    }
  });

  // Warnings
  if (counts.main > 40) {
    warnings.push({
      field: 'mainDeck',
      message: `El Main Deck tiene ${counts.main} cartas. Considera reducir a 40 para mejor consistencia.`,
      severity: 'warning',
    });
  }

  if (counts.extra === 0) {
    warnings.push({
      field: 'extraDeck',
      message: 'El Extra Deck está vacío. Considera agregar algunos monstruos de Extra Deck.',
      severity: 'warning',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates if adding a card would violate copy limit
 */
export function canAddCard(deck: Deck, cardId: number, deckType: 'MAIN' | 'EXTRA' | 'SIDE'): boolean {
  // Check current copies across all decks (Main + Extra + Side)
  const currentCopies = countCardCopies(deck, cardId);
  return currentCopies < 3;
}

/**
 * Gets remaining slots for a deck type
 */
export function getRemainingSlots(cards: DeckCard[], deckType: 'MAIN' | 'EXTRA' | 'SIDE'): number {
  const counts = countCardsByType(cards);

  switch (deckType) {
    case 'MAIN':
      return Math.max(0, 60 - counts.main);
    case 'EXTRA':
      return Math.max(0, 15 - counts.extra);
    case 'SIDE':
      return Math.max(0, 15 - counts.side);
  }
}
