'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Loader2, X, Filter, CheckCircle2, Ban, AlertCircle } from 'lucide-react';
import type { YGOCard } from '@/lib/ygoprodeck';
import type { DeckCard } from '@/lib/deck-validation';
import { getBanlistStatus, getMaxCopies, getBanlistLabel, getBanlistColor, isCardLegalByDate, getDateIllegalReason, type Format } from '@/lib/banlist';

interface CardSearchProps {
  deckType: 'MAIN' | 'EXTRA' | 'SIDE';
  format?: string;
  currentCards: DeckCard[];
  onCardSelect: (card: YGOCard) => void;
  onClose: () => void;
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

export default function CardSearch({ deckType, format, currentCards, onCardSelect, onClose }: CardSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState('');
  const [archetypes, setArchetypes] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<YGOCard[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [addedCardNotification, setAddedCardNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchArchetypes();
  }, []);

  // Cerrar modal con tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

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

  const handleSearch = async () => {
    if (!searchTerm.trim() && !searchDescription.trim() && !selectedType && !selectedAttribute && !selectedRace && !selectedLevel && !selectedArchetype) {
      setError('Ingresa al menos un criterio de búsqueda');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      // Build API URL with filters
      let url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
      const params: string[] = ['misc=yes']; // Include banlist info

      if (searchTerm.trim()) params.push(`fname=${encodeURIComponent(searchTerm)}`);
      if (searchDescription.trim()) params.push(`desc=${encodeURIComponent(searchDescription)}`);
      if (selectedType) params.push(`type=${encodeURIComponent(selectedType)}`);
      if (selectedAttribute) params.push(`attribute=${selectedAttribute}`);
      if (selectedRace) params.push(`race=${encodeURIComponent(selectedRace)}`);
      if (selectedLevel) params.push(`level=${selectedLevel}`);
      if (selectedArchetype) params.push(`archetype=${encodeURIComponent(selectedArchetype)}`);

      url += params.join('&');

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 400) {
          setError('No se encontraron cartas con esos criterios. Intenta con otros filtros.');
          setSearchResults([]);
          setIsSearching(false);
          return;
        }
        throw new Error('Error al buscar cartas');
      }

      const data = await response.json();

      // Filter cards based on deck type
      let filteredCards = data.data || [];

      // Tipos de cartas del Extra Deck (incluyendo variantes con Pendulum y Effect)
      const EXTRA_DECK_TYPES = [
        'Fusion Monster',
        'Synchro Monster',
        'Synchro Tuner Monster',
        'Synchro Pendulum Effect Monster',
        'XYZ Monster',
        'XYZ Pendulum Effect Monster',
        'Link Monster',
        'Pendulum Effect Fusion Monster'
      ];

      if (deckType === 'EXTRA') {
        // Extra Deck: only Fusion, Synchro, XYZ, Link
        filteredCards = filteredCards.filter((card: YGOCard) =>
          EXTRA_DECK_TYPES.includes(card.type)
        );
      } else if (deckType === 'MAIN') {
        // Main Deck: exclude Extra Deck monsters
        filteredCards = filteredCards.filter((card: YGOCard) =>
          !EXTRA_DECK_TYPES.includes(card.type)
        );
      }
      // Side Deck: incluye todas las cartas (Main + Extra)

      setSearchResults(filteredCards);

      if (filteredCards.length === 0) {
        if (deckType === 'EXTRA') {
          setError('No se encontraron monstruos de Extra Deck con esos criterios.');
        } else if (deckType === 'MAIN') {
          setError('No se encontraron cartas de Main Deck con esos criterios.');
        } else {
          setError('No se encontraron cartas con esos criterios.');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error al buscar cartas. Intenta de nuevo.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Cuenta cuántas copias de una carta hay en Main + Side
  const countCardCopies = (cardId: number): number => {
    let count = 0;
    for (const card of currentCards) {
      if (card.cardId === cardId && (card.deckType === 'MAIN' || card.deckType === 'SIDE')) {
        count += card.quantity;
      }
    }
    return count;
  };

  // Cuenta cuántas copias de una carta hay en Extra Deck
  const countExtraDeckCopies = (cardId: number): number => {
    let count = 0;
    for (const card of currentCards) {
      if (card.cardId === cardId && card.deckType === 'EXTRA') {
        count += card.quantity;
      }
    }
    return count;
  };

  // Verifica si se puede agregar una carta según banlist y fecha
  const canAddCardByBanlist = (card: YGOCard): { canAdd: boolean; reason?: string } => {
    if (!format || format === '') {
      return { canAdd: true };
    }

    const validFormats = ['TCG', 'OCG', 'GOAT', 'Edison'];
    const banlistFormat: Format = validFormats.includes(format) ? (format as Format) : 'TCG';

    // Check date legality first (for GOAT/Edison formats)
    if (!isCardLegalByDate(card, banlistFormat)) {
      const dateReason = getDateIllegalReason(card, banlistFormat);
      return {
        canAdd: false,
        reason: dateReason || `${card.name} no es legal en ${format}`,
      };
    }

    const status = getBanlistStatus(card, banlistFormat);
    const maxCopies = getMaxCopies(status);

    // Para Extra Deck, verificar copias en Extra Deck (máximo según banlist)
    if (deckType === 'EXTRA') {
      const extraCount = countExtraDeckCopies(card.id);

      if (maxCopies === 0) {
        return {
          canAdd: false,
          reason: `${card.name} está prohibida en ${format}`,
        };
      }

      if (extraCount >= maxCopies) {
        return {
          canAdd: false,
          reason: `Ya tienes ${extraCount} copia(s) de ${card.name} en el Extra Deck. Máximo permitido: ${maxCopies}`,
        };
      }

      return { canAdd: true };
    }

    // Para Main y Side Deck, verificar copias en Main + Side (máximo según banlist)
    const currentCount = countCardCopies(card.id);

    if (maxCopies === 0) {
      return {
        canAdd: false,
        reason: `${card.name} está prohibida en ${format}`,
      };
    }

    if (currentCount >= maxCopies) {
      return {
        canAdd: false,
        reason: `Ya tienes ${currentCount} copia(s) de ${card.name}. Máximo permitido: ${maxCopies}`,
      };
    }

    return { canAdd: true };
  };

  const handleCardClick = (card: YGOCard) => {
    // Verificar banlist antes de agregar
    const banlistCheck = canAddCardByBanlist(card);

    if (!banlistCheck.canAdd) {
      setError(banlistCheck.reason || 'No se puede agregar esta carta');
      return;
    }

    onCardSelect(card);
    // Modal ya no se cierra automáticamente al seleccionar una carta

    // Mostrar notificación de carta agregada
    setAddedCardNotification(card.name);

    // Ocultar notificación después de 2 segundos
    setTimeout(() => {
      setAddedCardNotification(null);
    }, 2000);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchDescription('');
    setSelectedType('');
    setSelectedAttribute('');
    setSelectedRace('');
    setSelectedLevel('');
    setSelectedArchetype('');
    setSearchResults([]);
    setError('');
  };

  // Filtrar tipos según el deckType
  const availableTypes = deckType === 'EXTRA'
    ? CARD_TYPES.filter(type =>
        type.includes('Fusion') ||
        type.includes('Synchro') ||
        type.includes('XYZ') ||
        type.includes('Link')
      )
    : CARD_TYPES.filter(type =>
        !type.includes('Fusion') &&
        !type.includes('Synchro') &&
        !type.includes('XYZ') &&
        !type.includes('Link')
      );

  // Manejar click fuera del modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Notificación de carta agregada */}
      {addedCardNotification && (
        <div className="fixed top-8 right-8 z-[60] animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border border-green-400">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">¡Carta agregada!</p>
              <p className="text-sm text-green-100">{addedCardNotification}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-rola-black border border-rola-gray rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-rola-gray flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg md:text-xl font-bold text-white">
              Buscar Cartas
            </h3>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              Agregando a: {deckType === 'MAIN' ? 'Main Deck' : deckType === 'EXTRA' ? 'Extra Deck' : 'Side Deck'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-rola-gray/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 md:p-6 border-b border-rola-gray space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nombre de la carta..."
                className="input w-full pl-10 text-base md:text-sm h-12 md:h-auto"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline flex-1 sm:flex-none h-12 md:h-auto"
              >
                <Filter className="w-5 h-5" />
                <span className="sm:inline">Filtros</span>
              </button>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="btn btn-primary flex-1 sm:flex-none h-12 md:h-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="sm:inline">Buscando...</span>
                  </>
                ) : (
                  'Buscar'
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t border-rola-gray">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Búsqueda en descripción */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Texto en descripción
                  </label>
                  <input
                    type="text"
                    value={searchDescription}
                    onChange={(e) => setSearchDescription(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Buscar en el texto de la carta..."
                    className="input w-full"
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
                    className="input w-full"
                  >
                    <option value="">Todos los tipos</option>
                    {availableTypes.map((type) => (
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
                    className="input w-full"
                  >
                    <option value="">Todos los atributos</option>
                    {ATTRIBUTES.map((attr) => (
                      <option key={attr} value={attr}>
                        {attr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Raza/Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Raza / Tipo
                  </label>
                  <select
                    value={selectedRace}
                    onChange={(e) => setSelectedRace(e.target.value)}
                    className="input w-full"
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
                    className="input w-full"
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
                    className="input w-full"
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

              {/* Clear Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {searchResults.length > 0 ? (
            <>
              <div className="mb-4 text-gray-400 text-xs md:text-sm">
                Se encontraron {searchResults.length} carta{searchResults.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-4">
                {searchResults.map((card) => {
                  const validFormats = ['TCG', 'OCG', 'GOAT', 'Edison'];
                  const banlistFormat: Format = format && validFormats.includes(format) ? (format as Format) : '';
                  const banlistStatus = banlistFormat ? getBanlistStatus(card, banlistFormat) : 'Unlimited';
                  const maxCopies = getMaxCopies(banlistStatus);
                  // Usar la función correcta según el deckType
                  const currentCount = deckType === 'EXTRA' ? countExtraDeckCopies(card.id) : countCardCopies(card.id);
                  const isForbidden = banlistStatus === 'Forbidden';
                  // El límite es según banlist para todos los deck types
                  const isAtLimit = currentCount >= maxCopies && maxCopies > 0;
                  const isDateIllegal = banlistFormat ? !isCardLegalByDate(card, banlistFormat) : false;
                  const isDisabled = isForbidden || isDateIllegal;

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(card)}
                      disabled={isDisabled}
                      className={`group relative aspect-[59/86] rounded-lg overflow-hidden border transition-colors ${
                        isDisabled
                          ? 'border-red-500/50 opacity-60 cursor-not-allowed'
                          : isAtLimit
                          ? 'border-orange-500/50 opacity-75'
                          : 'border-rola-gray/50 hover:border-rola-gold'
                      }`}
                    >
                      <Image
                        src={card.card_images[0].image_url}
                        alt={card.name}
                        fill
                        className="object-cover"
                      />

                      {/* Banlist and Date indicator */}
                      {format && (isDateIllegal || banlistStatus !== 'Unlimited') && (
                        <div className="absolute top-2 right-2 z-10">
                          {isDateIllegal && (
                            <div className="bg-purple-500 text-white rounded-full p-1.5 shadow-lg" title={getDateIllegalReason(card, banlistFormat) || 'No existía en este formato'}>
                              <AlertCircle className="w-4 h-4" />
                            </div>
                          )}
                          {!isDateIllegal && banlistStatus === 'Forbidden' && (
                            <div className="bg-red-500 text-white rounded-full p-1.5 shadow-lg">
                              <Ban className="w-4 h-4" />
                            </div>
                          )}
                          {!isDateIllegal && banlistStatus === 'Limited' && (
                            <div className="bg-yellow-500 text-black rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shadow-lg">
                              1
                            </div>
                          )}
                          {!isDateIllegal && banlistStatus === 'Semi-Limited' && (
                            <div className="bg-orange-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shadow-lg">
                              2
                            </div>
                          )}
                        </div>
                      )}

                      {/* Current count indicator */}
                      {currentCount > 0 && (
                        <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg">
                          {currentCount}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full">
                          <p className="text-xs font-medium text-white truncate">
                            {card.name}
                          </p>
                          {format && isDateIllegal && (
                            <p className="text-[10px] text-purple-300 truncate mt-0.5">
                              {getDateIllegalReason(card, banlistFormat)}
                            </p>
                          )}
                          {format && !isDateIllegal && banlistStatus !== 'Unlimited' && (
                            <p className="text-[10px] text-gray-300 truncate mt-0.5">
                              {getBanlistLabel(banlistStatus)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400">
                {isSearching ? 'Buscando cartas...' : 'Busca cartas usando el nombre o los filtros disponibles'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
