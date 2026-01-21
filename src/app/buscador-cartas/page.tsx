'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Search, X, Filter, Eye, ExternalLink } from 'lucide-react';

interface Card {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  card_images: Array<{
    id: number;
    image_url: string;
    image_url_small: string;
  }>;
  card_prices: Array<{
    cardmarket_price: string;
    tcgplayer_price: string;
    ebay_price: string;
    amazon_price: string;
  }>;
  card_sets?: Array<{
    set_name: string;
    set_code: string;
    set_rarity: string;
    set_price: string;
  }>;
  misc_info?: Array<{
    tcg_date?: string;
    ocg_date?: string;
    formats?: string[];
  }>;
}

const CARD_TYPES = [
  'Effect Monster',
  'Flip Effect Monster',
  'Flip Tuner Effect Monster',
  'Gemini Monster',
  'Normal Monster',
  'Normal Tuner Monster',
  'Pendulum Effect Monster',
  'Pendulum Flip Effect Monster',
  'Pendulum Normal Monster',
  'Pendulum Tuner Effect Monster',
  'Ritual Effect Monster',
  'Ritual Monster',
  'Skill Card',
  'Spell Card',
  'Spirit Monster',
  'Toon Monster',
  'Trap Card',
  'Tuner Monster',
  'Union Effect Monster',
  'Fusion Monster',
  'Link Monster',
  'Pendulum Effect Fusion Monster',
  'Synchro Monster',
  'Synchro Pendulum Effect Monster',
  'Synchro Tuner Monster',
  'XYZ Monster',
  'XYZ Pendulum Effect Monster',
];

const ATTRIBUTES = ['DARK', 'DIVINE', 'EARTH', 'FIRE', 'LIGHT', 'WATER', 'WIND'];

const RACES = [
  'Aqua',
  'Beast',
  'Beast-Warrior',
  'Creator-God',
  'Cyberse',
  'Dinosaur',
  'Divine-Beast',
  'Dragon',
  'Fairy',
  'Fiend',
  'Fish',
  'Insect',
  'Machine',
  'Plant',
  'Psychic',
  'Pyro',
  'Reptile',
  'Rock',
  'Sea Serpent',
  'Spellcaster',
  'Thunder',
  'Warrior',
  'Winged Beast',
  'Wyrm',
  'Zombie',
  'Normal',
  'Field',
  'Equip',
  'Continuous',
  'Quick-Play',
  'Ritual',
  'Counter',
];

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function BuscadorCartasPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Filtros
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const [archetypes, setArchetypes] = useState<string[]>([]);

  useEffect(() => {
    fetchArchetypes();
  }, []);

  const fetchArchetypes = async () => {
    try {
      const response = await fetch('https://db.ygoprodeck.com/api/v7/archetypes.php');
      if (response.ok) {
        const data = await response.json();
        setArchetypes(data.map((a: any) => a.archetype_name).sort());
      }
    } catch (error) {
      console.error('Error fetching archetypes:', error);
    }
  };

  const searchCards = async () => {
    setIsLoading(true);
    try {
      let url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
      const params: string[] = ['misc=yes'];

      if (searchName) params.push(`fname=${encodeURIComponent(searchName)}`);
      if (searchDescription) params.push(`desc=${encodeURIComponent(searchDescription)}`);
      if (selectedType) params.push(`type=${encodeURIComponent(selectedType)}`);
      if (selectedAttribute) params.push(`attribute=${selectedAttribute}`);
      if (selectedRace) params.push(`race=${encodeURIComponent(selectedRace)}`);
      if (selectedLevel) params.push(`level=${selectedLevel}`);
      if (selectedArchetype) params.push(`archetype=${encodeURIComponent(selectedArchetype)}`);

      url += params.join('&');

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCards(data.data || []);
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error('Error searching cards:', error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchDescription('');
    setSelectedType('');
    setSelectedAttribute('');
    setSelectedRace('');
    setSelectedLevel('');
    setSelectedArchetype('');
    setCards([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCards();
    }
  };

  const getRegionalAvailability = (card: Card) => {
    const miscInfo = card.misc_info?.[0];

    // Verificar por fechas de lanzamiento
    const hasTCGDate = miscInfo?.tcg_date !== undefined;
    const hasOCGDate = miscInfo?.ocg_date !== undefined;

    // Verificar por el array de formatos
    const formats = miscInfo?.formats || [];
    const inTCGFormat = formats.includes('TCG');
    const inOCGFormat = formats.includes('OCG');

    // Una carta está en TCG si tiene fecha TCG O está en el formato TCG
    const hasTCG = hasTCGDate || inTCGFormat;
    const hasOCG = hasOCGDate || inOCGFormat;

    return {
      tcg: hasTCG,
      ocg: hasOCG,
      both: hasTCG && hasOCG,
    };
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="section">
          <div className="container-custom space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                  Buscador de Cartas <span className="text-gradient">Yu-Gi-Oh!</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  Busca cartas usando la base de datos de YGOProDeck
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-outline btn-sm sm:btn w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
                  <span className="sm:hidden">{showFilters ? 'Ocultar' : 'Filtros'}</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="card p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de la carta
                    </label>
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ej: Dark Magician"
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    />
                  </div>

                  {/* Texto en descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Texto en descripción
                    </label>
                    <input
                      type="text"
                      value={searchDescription}
                      onChange={(e) => setSearchDescription(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ej: destroy, negate"
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de carta
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Todos los tipos</option>
                      {CARD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Atributo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Atributo
                    </label>
                    <select
                      value={selectedAttribute}
                      onChange={(e) => setSelectedAttribute(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Todos los atributos</option>
                      {ATTRIBUTES.map((attr) => (
                        <option key={attr} value={attr}>
                          {attr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Race/Tipo de monstruo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Raza / Tipo
                    </label>
                    <select
                      value={selectedRace}
                      onChange={(e) => setSelectedRace(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Todas las razas</option>
                      {RACES.map((race) => (
                        <option key={race} value={race}>
                          {race}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nivel */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nivel / Rank
                    </label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Todos los niveles</option>
                      {LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Arquetipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Arquetipo
                    </label>
                    <select
                      value={selectedArchetype}
                      onChange={(e) => setSelectedArchetype(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Todos los arquetipos</option>
                      {archetypes.map((arch) => (
                        <option key={arch} value={arch}>
                          {arch}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                  <button onClick={searchCards} className="btn btn-primary btn-sm sm:btn flex-1" disabled={isLoading}>
                    <Search className="w-4 h-4" />
                    {isLoading ? 'Buscando...' : 'Buscar'}
                  </button>
                  <button onClick={clearFilters} className="btn btn-ghost btn-sm sm:btn">
                    <X className="w-4 h-4" />
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-12 card">
                <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Buscando cartas...</p>
              </div>
            ) : cards.length > 0 ? (
              <div>
                <div className="mb-4 text-gray-400">
                  Se encontraron {cards.length} carta{cards.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="card p-2 sm:p-3 cursor-pointer hover:border-rola-gold transition-all group"
                    >
                      <div className="relative">
                        <img
                          src={card.card_images[0].image_url_small}
                          alt={card.name}
                          className="w-full rounded-lg mb-2 group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {(() => {
                            const availability = getRegionalAvailability(card);
                            return (
                              <>
                                {availability.tcg && (
                                  <span className="px-2 py-0.5 bg-blue-500/90 text-white text-[10px] font-bold rounded">
                                    TCG
                                  </span>
                                )}
                                {availability.ocg && (
                                  <span className="px-2 py-0.5 bg-red-500/90 text-white text-[10px] font-bold rounded">
                                    OCG
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <h3 className="text-white text-xs sm:text-sm font-medium truncate">{card.name}</h3>
                      <p className="text-gray-500 text-[10px] sm:text-xs truncate">{card.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchName || searchDescription || selectedType || selectedAttribute || selectedRace || selectedLevel || selectedArchetype ? (
              <div className="text-center py-12 card">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No se encontraron cartas con esos filtros</p>
              </div>
            ) : (
              <div className="text-center py-12 card">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Usa los filtros para buscar cartas</p>
              </div>
            )}

            {/* Card Detail Modal */}
            {selectedCard && (
              <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
                <div className="min-h-screen flex items-center justify-center p-4">
                  <div className="card p-6 max-w-4xl w-full my-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="font-display text-2xl font-bold text-white mb-2">
                          {selectedCard.name}
                        </h2>
                        <div className="flex gap-2">
                          {(() => {
                            const availability = getRegionalAvailability(selectedCard);
                            return (
                              <>
                                {availability.tcg && (
                                  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                                    TCG
                                  </span>
                                )}
                                {availability.ocg && (
                                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded">
                                    OCG
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCard(null)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Image */}
                      <div>
                        <img
                          src={selectedCard.card_images[0].image_url}
                          alt={selectedCard.name}
                          className="w-full rounded-lg"
                        />
                        {selectedCard.card_prices && selectedCard.card_prices[0] && (
                          <div className="mt-4 p-4 bg-rola-gray/30 rounded-lg">
                            <h3 className="text-white font-semibold mb-2">Precios estimados</h3>
                            <div className="space-y-1 text-sm">
                              {selectedCard.card_prices[0].cardmarket_price && (
                                <p className="text-gray-400">
                                  CardMarket:{' '}
                                  <span className="text-rola-gold">
                                    €{selectedCard.card_prices[0].cardmarket_price}
                                  </span>
                                </p>
                              )}
                              {selectedCard.card_prices[0].tcgplayer_price && (
                                <p className="text-gray-400">
                                  TCGPlayer:{' '}
                                  <span className="text-rola-gold">
                                    ${selectedCard.card_prices[0].tcgplayer_price}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-4">
                        {/* Regional Release Dates */}
                        {selectedCard.misc_info && selectedCard.misc_info[0] && (
                          <div className="p-3 bg-rola-gray/30 rounded-lg">
                            <h3 className="text-white font-semibold mb-2">Fechas de Lanzamiento</h3>
                            <div className="space-y-1 text-sm">
                              {selectedCard.misc_info[0].tcg_date && (
                                <p className="text-gray-400">
                                  <span className="inline-block px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded mr-2">
                                    TCG
                                  </span>
                                  {new Date(selectedCard.misc_info[0].tcg_date).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                              {selectedCard.misc_info[0].ocg_date && (
                                <p className="text-gray-400">
                                  <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded mr-2">
                                    OCG
                                  </span>
                                  {new Date(selectedCard.misc_info[0].ocg_date).toLocaleDateString('es-MX', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="text-gray-500 text-sm mb-1">Tipo</h3>
                          <p className="text-white">{selectedCard.type}</p>
                        </div>

                        {selectedCard.attribute && (
                          <div>
                            <h3 className="text-gray-500 text-sm mb-1">Atributo</h3>
                            <p className="text-white">{selectedCard.attribute}</p>
                          </div>
                        )}

                        <div>
                          <h3 className="text-gray-500 text-sm mb-1">Raza / Tipo</h3>
                          <p className="text-white">{selectedCard.race}</p>
                        </div>

                        {selectedCard.level !== undefined && (
                          <div>
                            <h3 className="text-gray-500 text-sm mb-1">Nivel / Rank</h3>
                            <p className="text-white">{selectedCard.level}</p>
                          </div>
                        )}

                        {selectedCard.atk !== undefined && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-gray-500 text-sm mb-1">ATK</h3>
                              <p className="text-white font-semibold">{selectedCard.atk}</p>
                            </div>
                            {selectedCard.def !== undefined && (
                              <div>
                                <h3 className="text-gray-500 text-sm mb-1">DEF</h3>
                                <p className="text-white font-semibold">{selectedCard.def}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedCard.archetype && (
                          <div>
                            <h3 className="text-gray-500 text-sm mb-1">Arquetipo</h3>
                            <p className="text-white">{selectedCard.archetype}</p>
                          </div>
                        )}

                        <div>
                          <h3 className="text-gray-500 text-sm mb-1">Descripción</h3>
                          <p className="text-gray-300 text-sm leading-relaxed">{selectedCard.desc}</p>
                        </div>

                        <a
                          href={`https://ygoprodeck.com/card/${selectedCard.name.replace(/\s+/g, '-').toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline w-full"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Ver en YGOProDeck
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
