// YGOProDeck API Client
// Documentation: https://ygoprodeck.com/api-guide/

const API_BASE_URL = process.env.YGOPRODECK_API_URL || 'https://db.ygoprodeck.com/api/v7';

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

export interface YGOCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  linkval?: number;
  linkmarkers?: string[];
  scale?: number;
  card_sets?: CardSet[];
  card_images: CardImage[];
  card_prices: CardPrice[];
  banlist_info?: BanlistInfo;
  misc_info?: MiscInfo[];
}

export interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface CardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

export interface YGOCardResponse {
  data: YGOCard[];
}

export interface YGOSearchParams {
  name?: string;
  fname?: string; // Fuzzy name search
  id?: number;
  type?: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  archetype?: string;
  cardset?: string;
  banlist?: 'tcg' | 'ocg' | 'goat';
  sort?: 'name' | 'atk' | 'def' | 'level' | 'id' | 'new';
  num?: number; // Results per page
  offset?: number;
}

class YGOProDeckAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('No cards found matching the criteria');
      }
      throw new Error(`YGOProDeck API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Search for cards by various parameters
   */
  async searchCards(params: YGOSearchParams): Promise<YGOCard[]> {
    const response = await this.request<YGOCardResponse>('/cardinfo.php', params as Record<string, string | number | undefined>);
    return response.data;
  }

  /**
   * Get a card by its exact name
   */
  async getCardByName(name: string): Promise<YGOCard | null> {
    try {
      const cards = await this.searchCards({ name });
      return cards[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get a card by its ID
   */
  async getCardById(id: number): Promise<YGOCard | null> {
    try {
      const cards = await this.searchCards({ id });
      return cards[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Fuzzy search cards by name
   */
  async fuzzySearch(name: string, limit: number = 10): Promise<YGOCard[]> {
    try {
      return await this.searchCards({ fname: name, num: limit });
    } catch {
      return [];
    }
  }

  /**
   * Get cards from a specific set
   */
  async getCardsBySet(setCode: string): Promise<YGOCard[]> {
    try {
      return await this.searchCards({ cardset: setCode });
    } catch {
      return [];
    }
  }

  /**
   * Get cards by archetype
   */
  async getCardsByArchetype(archetype: string): Promise<YGOCard[]> {
    try {
      return await this.searchCards({ archetype });
    } catch {
      return [];
    }
  }

  /**
   * Get all archetypes
   */
  async getArchetypes(): Promise<string[]> {
    const response = await this.request<{ archetype: string }[]>('/archetypes.php');
    return response.map((a) => a.archetype);
  }

  /**
   * Get all card sets
   */
  async getCardSets(): Promise<{ set_name: string; set_code: string; num_of_cards: number; tcg_date: string }[]> {
    return this.request('/cardsets.php');
  }

  /**
   * Get random card
   */
  async getRandomCard(): Promise<YGOCard | null> {
    try {
      const response = await this.request<YGOCardResponse>('/randomcard.php');
      return response.data[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get card image URL
   */
  getCardImageUrl(cardId: number, size: 'full' | 'small' | 'cropped' = 'small'): string {
    const sizeMap = {
      full: '',
      small: '_small',
      cropped: '_cropped',
    };
    return `https://images.ygoprodeck.com/images/cards${sizeMap[size]}/${cardId}.jpg`;
  }
}

export const ygoApi = new YGOProDeckAPI();
export default ygoApi;
