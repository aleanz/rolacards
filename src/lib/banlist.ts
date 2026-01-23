// Banlist validation for Yu-Gi-Oh TCG/OCG/GOAT/Edison formats

export type BanlistStatus = 'Forbidden' | 'Limited' | 'Semi-Limited' | 'Unlimited';
export type Format = 'TCG' | 'OCG' | 'GOAT' | 'Edison' | 'Genesys' | '';

export interface BanlistInfo {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
  ban_edison?: string;
}

export interface MiscInfo {
  beta_name?: string;
  tcg_date?: string;
  ocg_date?: string;
  konami_id?: number;
  has_effect?: number;
}

export interface CardWithBanlist {
  id: number;
  name: string;
  banlist_info?: BanlistInfo;
  misc_info?: MiscInfo[];
  [key: string]: any;
}

/**
 * Gets the banlist status for a card in a specific format
 */
export function getBanlistStatus(card: CardWithBanlist, format: Format): BanlistStatus {
  if (!format || !card.banlist_info) {
    return 'Unlimited';
  }

  // Genesys format uses a point system, not banlist
  if (format === 'Genesys') {
    return 'Unlimited';
  }

  const banlistInfo = card.banlist_info;

  switch (format) {
    case 'TCG':
      return (banlistInfo.ban_tcg as BanlistStatus) || 'Unlimited';
    case 'OCG':
      return (banlistInfo.ban_ocg as BanlistStatus) || 'Unlimited';
    case 'GOAT':
      return (banlistInfo.ban_goat as BanlistStatus) || 'Unlimited';
    case 'Edison':
      return (banlistInfo.ban_edison as BanlistStatus) || 'Unlimited';
    default:
      return 'Unlimited';
  }
}

/**
 * Gets the maximum allowed copies for a card based on banlist
 */
export function getMaxCopies(status: BanlistStatus): number {
  switch (status) {
    case 'Forbidden':
      return 0;
    case 'Limited':
      return 1;
    case 'Semi-Limited':
      return 2;
    case 'Unlimited':
      return 3;
    default:
      return 3;
  }
}

/**
 * Checks if a card can be added to the deck based on banlist restrictions
 */
export function canAddCardByBanlist(
  card: CardWithBanlist,
  format: Format,
  currentCount: number
): { canAdd: boolean; maxCopies: number; status: BanlistStatus } {
  const status = getBanlistStatus(card, format);
  const maxCopies = getMaxCopies(status);

  return {
    canAdd: currentCount < maxCopies,
    maxCopies,
    status,
  };
}

/**
 * Gets the icon name for a banlist status
 */
export function getBanlistIcon(status: BanlistStatus): string | null {
  switch (status) {
    case 'Forbidden':
      return 'forbidden'; // ⛔
    case 'Limited':
      return 'limited'; // 1
    case 'Semi-Limited':
      return 'semi-limited'; // 2
    default:
      return null;
  }
}

/**
 * Gets the color for a banlist status
 */
export function getBanlistColor(status: BanlistStatus): string {
  switch (status) {
    case 'Forbidden':
      return 'bg-red-500';
    case 'Limited':
      return 'bg-yellow-500';
    case 'Semi-Limited':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Gets the label for a banlist status
 */
export function getBanlistLabel(status: BanlistStatus): string {
  switch (status) {
    case 'Forbidden':
      return 'Prohibida';
    case 'Limited':
      return 'Limitada (1)';
    case 'Semi-Limited':
      return 'Semi-Limitada (2)';
    default:
      return 'Ilimitada';
  }
}

/**
 * Format cutoff dates for historical formats
 */
const FORMAT_CUTOFF_DATES = {
  GOAT: '2005-04-01', // April 2005
  Edison: '2010-03-01', // March 2010
};

/**
 * Checks if a card existed at the time of a historical format
 */
export function isCardLegalByDate(card: CardWithBanlist, format: Format): boolean {
  // Genesys format blocks Link and Pendulum cards
  if (format === 'Genesys') {
    const frameType = (card as any).frameType?.toLowerCase();
    if (frameType === 'link' || frameType === 'pendulum') {
      return false;
    }
    return true;
  }

  // Modern formats (TCG/OCG) don't have date restrictions
  if (format === 'TCG' || format === 'OCG' || format === '') {
    return true;
  }

  // If card has no misc_info or no dates, allow it (old cards)
  if (!card.misc_info || card.misc_info.length === 0) {
    return true;
  }

  const miscInfo = card.misc_info[0];
  const cutoffDate = FORMAT_CUTOFF_DATES[format];

  if (!cutoffDate) {
    return true;
  }

  // Check TCG date for TCG-based formats (GOAT, Edison)
  // Use OCG date as fallback if TCG date is not available
  const releaseDate = miscInfo.tcg_date || miscInfo.ocg_date;

  if (!releaseDate) {
    return true; // If no date available, allow it
  }

  // Compare dates (format: YYYY-MM-DD)
  return releaseDate <= cutoffDate;
}

/**
 * Gets the reason why a card is not legal by date
 */
export function getDateIllegalReason(card: CardWithBanlist, format: Format): string | null {
  if (!isCardLegalByDate(card, format)) {
    if (format === 'Genesys') {
      const frameType = (card as any).frameType?.toLowerCase();
      if (frameType === 'link') {
        return 'Las cartas Link están prohibidas en formato Genesys';
      }
      if (frameType === 'pendulum') {
        return 'Las cartas Péndulo están prohibidas en formato Genesys';
      }
    }
    const formatYear = format === 'GOAT' ? '2005' : '2010';
    return `Esta carta no existía en ${formatYear}`;
  }
  return null;
}

/**
 * Gets the Genesys points for a card
 */
export function getGenesysPoints(card: CardWithBanlist): number {
  // Genesys points are in misc_info array
  if (card.misc_info && card.misc_info.length > 0) {
    const miscInfo = card.misc_info[0] as any;
    return miscInfo.genesys_points || 0;
  }
  return 0;
}

/**
 * Calculates total Genesys points for a list of cards
 */
export function calculateGenesysPoints(cards: Array<{ cardData: any; quantity: number }>): number {
  return cards.reduce((total, card) => {
    const points = getGenesysPoints(card.cardData);
    return total + (points * card.quantity);
  }, 0);
}

/**
 * Checks if a card type is allowed in Genesys format
 */
export function isCardTypeAllowedInGenesys(card: CardWithBanlist): boolean {
  const frameType = (card as any).frameType?.toLowerCase();
  return frameType !== 'link' && frameType !== 'pendulum';
}

/**
 * Validates an entire deck against banlist rules for a specific format
 * Returns an array of errors found
 */
export interface DeckBanlistError {
  cardName: string;
  reason: string;
  quantity: number;
  maxAllowed: number;
}

export function validateDeckAgainstBanlist(
  cards: Array<{ cardData: any; quantity: number; placement: string }>,
  format: Format
): DeckBanlistError[] {
  const errors: DeckBanlistError[] = [];

  // Count cards across Main and Side deck (as per TCG rules)
  const cardCounts = new Map<number, { name: string; total: number; cardData: any }>();

  cards.forEach(({ cardData, quantity, placement }) => {
    // Only count Main and Side deck for copy limits
    if (placement === 'main' || placement === 'side') {
      const cardId = cardData.id;
      const current = cardCounts.get(cardId);
      if (current) {
        current.total += quantity;
      } else {
        cardCounts.set(cardId, {
          name: cardData.name,
          total: quantity,
          cardData: cardData,
        });
      }
    }
  });

  // Validate each unique card
  cardCounts.forEach(({ name, total, cardData }) => {
    // Check banlist status
    const status = getBanlistStatus(cardData, format);
    const maxCopies = getMaxCopies(status);

    if (total > maxCopies) {
      errors.push({
        cardName: name,
        reason: `${getBanlistLabel(status)} - máximo ${maxCopies} ${maxCopies === 1 ? 'copia' : 'copias'}`,
        quantity: total,
        maxAllowed: maxCopies,
      });
    }

    // Check if card is legal by date (for historical formats)
    if (!isCardLegalByDate(cardData, format)) {
      const dateReason = getDateIllegalReason(cardData, format);
      errors.push({
        cardName: name,
        reason: dateReason || 'Carta no legal en este formato',
        quantity: total,
        maxAllowed: 0,
      });
    }
  });

  return errors;
}
