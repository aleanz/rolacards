// Banlist validation for Yu-Gi-Oh TCG/OCG/GOAT/Edison formats

export type BanlistStatus = 'Forbidden' | 'Limited' | 'Semi-Limited' | 'Unlimited';
export type Format = 'TCG' | 'OCG' | 'GOAT' | 'Edison' | '';

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
    const formatYear = format === 'GOAT' ? '2005' : '2010';
    return `Esta carta no existía en ${formatYear}`;
  }
  return null;
}
