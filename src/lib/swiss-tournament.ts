/**
 * Sistema de Torneos con Formato Suizo
 * Implementa las reglas oficiales de Konami Tournament Policy v2.5
 *
 * Características:
 * - Cálculo automático de rondas según participantes
 * - Emparejamiento suizo con algoritmo de peso
 * - Tiebreakers: OMW%, GW%, OGW%
 * - Soporte para byes
 * - Top Cut automático
 */

// ==================== TIPOS ====================

export interface Player {
  id: string;
  name: string;
  matchPoints: number;
  matchWins: number;
  matchLosses: number;
  matchDraws: number;
  gameWins: number;
  gameLosses: number;
  opponentMatchWinPct: number;
  gameWinPct: number;
  opponentGameWinPct: number;
  opponents: string[];
  hasBye: boolean;
  dropped: boolean;
  seed: number;
}

export interface Match {
  id: string;
  round: number;
  table: number;
  player1Id: string | null;
  player2Id: string | null;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  winnerId: string | null;
  isBye: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED' | 'NO_SHOW';
}

export interface TournamentConfig {
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
  roundTimeMinutes: number;
}

export interface StandingsEntry {
  rank: number;
  playerId: string;
  playerName: string;
  matchPoints: number;
  record: string; // "W-L-D"
  omwPct: number;
  gwPct: number;
  ogwPct: number;
}

// ==================== CONSTANTES ====================

/**
 * Tabla de rondas suizas según número de participantes
 * Basado en Konami Tournament Policy v2.5 (Sept 2025)
 */
const SWISS_ROUNDS_TABLE_TIER_1_2: { min: number; max: number; rounds: number; topCut: number }[] = [
  { min: 4, max: 8, rounds: 3, topCut: 0 },
  { min: 9, max: 16, rounds: 4, topCut: 4 },
  { min: 17, max: 32, rounds: 5, topCut: 4 },
  { min: 33, max: 64, rounds: 6, topCut: 8 },
  { min: 65, max: 128, rounds: 7, topCut: 8 },
  { min: 129, max: 256, rounds: 8, topCut: 8 },
  { min: 257, max: 512, rounds: 9, topCut: 8 },
  { min: 513, max: 1024, rounds: 10, topCut: 8 },
  { min: 1025, max: 2048, rounds: 11, topCut: 8 },
  { min: 2049, max: Infinity, rounds: 12, topCut: 0 },
];

// Tier 3-4 tiene 3 rondas adicionales
const SWISS_ROUNDS_TABLE_TIER_3_4: { min: number; max: number; rounds: number; topCut: number }[] = [
  { min: 4, max: 8, rounds: 6, topCut: 0 },
  { min: 9, max: 16, rounds: 7, topCut: 8 },
  { min: 17, max: 32, rounds: 8, topCut: 8 },
  { min: 33, max: 64, rounds: 9, topCut: 8 },
  { min: 65, max: 128, rounds: 10, topCut: 8 },
  { min: 129, max: 256, rounds: 11, topCut: 8 },
  { min: 257, max: 512, rounds: 12, topCut: 8 },
  { min: 513, max: 1024, rounds: 13, topCut: 8 },
  { min: 1025, max: 2048, rounds: 14, topCut: 8 },
  { min: 2049, max: Infinity, rounds: 15, topCut: 0 },
];

// Puntos por resultado de match
const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const POINTS_LOSS = 0;

// Mínimo OMW% (33% según reglas oficiales)
const MIN_OMW_PERCENTAGE = 0.33;

// ==================== FUNCIONES PRINCIPALES ====================

/**
 * Calcula el número de rondas suizas y top cut según participantes
 */
export function calculateSwissRounds(
  playerCount: number,
  tier: TournamentConfig['tier'] = 'TIER_1'
): { rounds: number; topCut: number } {
  const table = tier === 'TIER_3' || tier === 'TIER_4'
    ? SWISS_ROUNDS_TABLE_TIER_3_4
    : SWISS_ROUNDS_TABLE_TIER_1_2;

  for (const entry of table) {
    if (playerCount >= entry.min && playerCount <= entry.max) {
      return { rounds: entry.rounds, topCut: entry.topCut };
    }
  }

  // Fallback para casos extremos
  return { rounds: 3, topCut: 0 };
}

/**
 * Calcula el Match Win Percentage de un jugador
 * Mínimo 33% según reglas oficiales
 */
export function calculateMatchWinPercentage(player: Player, totalRounds: number): number {
  if (totalRounds === 0) return MIN_OMW_PERCENTAGE;

  const maxPoints = totalRounds * POINTS_WIN;
  const percentage = player.matchPoints / maxPoints;

  return Math.max(percentage, MIN_OMW_PERCENTAGE);
}

/**
 * Calcula el Game Win Percentage de un jugador
 */
export function calculateGameWinPercentage(player: Player): number {
  const totalGames = player.gameWins + player.gameLosses;
  if (totalGames === 0) return MIN_OMW_PERCENTAGE;

  const percentage = player.gameWins / totalGames;
  return Math.max(percentage, MIN_OMW_PERCENTAGE);
}

/**
 * Calcula el Opponent Match Win Percentage (OMW%)
 * Promedio del MWP de todos los oponentes (excluyendo byes)
 */
export function calculateOMW(
  player: Player,
  allPlayers: Map<string, Player>,
  totalRounds: number
): number {
  const opponents = player.opponents.filter(id => {
    const opp = allPlayers.get(id);
    return opp && !opp.hasBye;
  });

  if (opponents.length === 0) return MIN_OMW_PERCENTAGE;

  let totalMWP = 0;
  for (const oppId of opponents) {
    const opponent = allPlayers.get(oppId);
    if (opponent) {
      totalMWP += calculateMatchWinPercentage(opponent, totalRounds);
    }
  }

  return totalMWP / opponents.length;
}

/**
 * Calcula el Opponent Game Win Percentage (OGW%)
 */
export function calculateOGW(
  player: Player,
  allPlayers: Map<string, Player>
): number {
  const opponents = player.opponents.filter(id => {
    const opp = allPlayers.get(id);
    return opp && !opp.hasBye;
  });

  if (opponents.length === 0) return MIN_OMW_PERCENTAGE;

  let totalGWP = 0;
  for (const oppId of opponents) {
    const opponent = allPlayers.get(oppId);
    if (opponent) {
      totalGWP += calculateGameWinPercentage(opponent);
    }
  }

  return totalGWP / opponents.length;
}

/**
 * Actualiza todos los tiebreakers de los jugadores
 */
export function updateAllTiebreakers(
  players: Map<string, Player>,
  totalRounds: number
): void {
  players.forEach((player) => {
    player.opponentMatchWinPct = calculateOMW(player, players, totalRounds);
    player.gameWinPct = calculateGameWinPercentage(player);
    player.opponentGameWinPct = calculateOGW(player, players);
  });
}

/**
 * Ordena los jugadores para standings
 * Criterios: Match Points > OMW% > GW% > OGW%
 */
export function sortStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    // 1. Match Points (mayor es mejor)
    if (b.matchPoints !== a.matchPoints) {
      return b.matchPoints - a.matchPoints;
    }

    // 2. OMW% (mayor es mejor)
    if (b.opponentMatchWinPct !== a.opponentMatchWinPct) {
      return b.opponentMatchWinPct - a.opponentMatchWinPct;
    }

    // 3. GW% (mayor es mejor)
    if (b.gameWinPct !== a.gameWinPct) {
      return b.gameWinPct - a.gameWinPct;
    }

    // 4. OGW% (mayor es mejor)
    if (b.opponentGameWinPct !== a.opponentGameWinPct) {
      return b.opponentGameWinPct - a.opponentGameWinPct;
    }

    // 5. Seed inicial (menor es mejor - se registró primero)
    return a.seed - b.seed;
  });
}

/**
 * Genera los standings con ranking
 */
export function generateStandings(
  players: Map<string, Player>,
  totalRounds: number
): StandingsEntry[] {
  updateAllTiebreakers(players, totalRounds);

  const activePlayers = Array.from(players.values()).filter(p => !p.dropped);
  const sorted = sortStandings(activePlayers);

  return sorted.map((player, index) => ({
    rank: index + 1,
    playerId: player.id,
    playerName: player.name,
    matchPoints: player.matchPoints,
    record: `${player.matchWins}-${player.matchLosses}-${player.matchDraws}`,
    omwPct: Math.round(player.opponentMatchWinPct * 10000) / 100, // 2 decimales
    gwPct: Math.round(player.gameWinPct * 10000) / 100,
    ogwPct: Math.round(player.opponentGameWinPct * 10000) / 100,
  }));
}

// ==================== EMPAREJAMIENTO SUIZO ====================

/**
 * Genera emparejamientos para una ronda
 * Algoritmo: Empareja jugadores con puntos similares evitando repeticiones
 */
export function generatePairings(
  players: Map<string, Player>,
  round: number,
  totalRounds: number
): Match[] {
  // Actualizar tiebreakers primero
  updateAllTiebreakers(players, totalRounds);

  // Filtrar jugadores activos (no dropped)
  const activePlayers = Array.from(players.values())
    .filter(p => !p.dropped)
    .sort((a, b) => {
      // Ordenar por puntos, luego por tiebreakers
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
      if (b.opponentMatchWinPct !== a.opponentMatchWinPct) {
        return b.opponentMatchWinPct - a.opponentMatchWinPct;
      }
      return a.seed - b.seed;
    });

  const matches: Match[] = [];
  const paired = new Set<string>();
  let tableNumber = 1;

  // Si hay número impar, asignar bye al jugador con menos puntos que no haya tenido bye
  if (activePlayers.length % 2 === 1) {
    // Buscar desde abajo (menos puntos) quien no ha tenido bye
    for (let i = activePlayers.length - 1; i >= 0; i--) {
      const player = activePlayers[i];
      if (!player.hasBye) {
        matches.push({
          id: `${round}-bye-${player.id}`,
          round,
          table: 0,
          player1Id: player.id,
          player2Id: null,
          player1Wins: 2,
          player2Wins: 0,
          draws: 0,
          winnerId: player.id,
          isBye: true,
          status: 'FINISHED',
        });
        paired.add(player.id);
        player.hasBye = true;
        break;
      }
    }
  }

  // Agrupar jugadores por puntos
  const scoreGroups = new Map<number, Player[]>();
  for (const player of activePlayers) {
    if (paired.has(player.id)) continue;

    const points = player.matchPoints;
    if (!scoreGroups.has(points)) {
      scoreGroups.set(points, []);
    }
    scoreGroups.get(points)!.push(player);
  }

  // Ordenar grupos por puntos (mayor a menor)
  const sortedGroups = Array.from(scoreGroups.entries())
    .sort((a, b) => b[0] - a[0]);

  // Pool de jugadores sin emparejar (para "flotar" entre grupos)
  let floaters: Player[] = [];

  for (const [, groupPlayers] of sortedGroups) {
    // Combinar con floaters del grupo anterior
    const poolToMatch = [...floaters, ...groupPlayers];
    floaters = [];

    // Emparejar dentro del pool
    while (poolToMatch.length >= 2) {
      const player1 = poolToMatch.shift()!;
      if (paired.has(player1.id)) continue;

      // Buscar el mejor oponente que no haya enfrentado
      let bestOpponentIndex = -1;
      for (let i = 0; i < poolToMatch.length; i++) {
        const candidate = poolToMatch[i];
        if (paired.has(candidate.id)) continue;
        if (player1.opponents.includes(candidate.id)) continue;

        bestOpponentIndex = i;
        break;
      }

      if (bestOpponentIndex !== -1) {
        const player2 = poolToMatch.splice(bestOpponentIndex, 1)[0];

        matches.push({
          id: `${round}-${tableNumber}`,
          round,
          table: tableNumber,
          player1Id: player1.id,
          player2Id: player2.id,
          player1Wins: 0,
          player2Wins: 0,
          draws: 0,
          winnerId: null,
          isBye: false,
          status: 'PENDING',
        });

        paired.add(player1.id);
        paired.add(player2.id);
        tableNumber++;
      } else {
        // No se encontró oponente válido, flotar al siguiente grupo
        floaters.push(player1);
      }
    }

    // Si queda uno sin emparejar, pasa al siguiente grupo
    if (poolToMatch.length === 1) {
      floaters.push(poolToMatch[0]);
    }
  }

  // Si quedan floaters, intentar emparejarlos (permitiendo rematches como último recurso)
  while (floaters.length >= 2) {
    const player1 = floaters.shift()!;
    const player2 = floaters.shift()!;

    matches.push({
      id: `${round}-${tableNumber}`,
      round,
      table: tableNumber,
      player1Id: player1.id,
      player2Id: player2.id,
      player1Wins: 0,
      player2Wins: 0,
      draws: 0,
      winnerId: null,
      isBye: false,
      status: 'PENDING',
    });

    paired.add(player1.id);
    paired.add(player2.id);
    tableNumber++;
  }

  return matches;
}

/**
 * Procesa el resultado de un match y actualiza estadísticas
 */
export function processMatchResult(
  match: Match,
  players: Map<string, Player>
): void {
  if (!match.player1Id) return;

  const player1 = players.get(match.player1Id);
  if (!player1) return;

  // Registrar oponente (si no es bye)
  if (match.player2Id) {
    const player2 = players.get(match.player2Id);
    if (player2) {
      // Agregar a lista de oponentes
      if (!player1.opponents.includes(match.player2Id)) {
        player1.opponents.push(match.player2Id);
      }
      if (!player2.opponents.includes(match.player1Id)) {
        player2.opponents.push(match.player1Id);
      }

      // Actualizar game wins/losses
      player1.gameWins += match.player1Wins;
      player1.gameLosses += match.player2Wins;
      player2.gameWins += match.player2Wins;
      player2.gameLosses += match.player1Wins;

      // Determinar resultado del match
      if (match.player1Wins > match.player2Wins) {
        // Player 1 gana
        player1.matchWins++;
        player1.matchPoints += POINTS_WIN;
        player2.matchLosses++;
        match.winnerId = match.player1Id;
      } else if (match.player2Wins > match.player1Wins) {
        // Player 2 gana
        player2.matchWins++;
        player2.matchPoints += POINTS_WIN;
        player1.matchLosses++;
        match.winnerId = match.player2Id;
      } else {
        // Empate (doble derrota según reglas v2.5)
        player1.matchLosses++;
        player2.matchLosses++;
        match.winnerId = null;
      }
    }
  } else if (match.isBye) {
    // Bye: 2-0 automático
    player1.matchWins++;
    player1.matchPoints += POINTS_WIN;
    player1.gameWins += 2;
    match.winnerId = match.player1Id;
  }

  match.status = 'FINISHED';
}

/**
 * Verifica si todos los matches de una ronda están terminados
 */
export function isRoundComplete(matches: Match[], round: number): boolean {
  const roundMatches = matches.filter(m => m.round === round);
  return roundMatches.every(m => m.status === 'FINISHED' || m.status === 'NO_SHOW');
}

/**
 * Obtiene los jugadores que califican al Top Cut
 */
export function getTopCutPlayers(
  players: Map<string, Player>,
  totalRounds: number,
  topCutSize: number
): Player[] {
  if (topCutSize === 0) return [];

  const standings = generateStandings(players, totalRounds);
  return standings
    .slice(0, topCutSize)
    .map(s => players.get(s.playerId)!)
    .filter(Boolean);
}

/**
 * Genera bracket de eliminación directa para Top Cut
 */
export function generateTopCutBracket(
  topPlayers: Player[],
  startingRound: number
): Match[] {
  const matches: Match[] = [];
  const size = topPlayers.length;

  if (size < 2) return matches;

  // Seeding estándar para Top 4 o Top 8
  let seeding: number[];
  if (size === 4) {
    seeding = [0, 3, 1, 2]; // 1v4, 2v3
  } else if (size === 8) {
    seeding = [0, 7, 3, 4, 1, 6, 2, 5]; // 1v8, 4v5, 2v7, 3v6
  } else {
    // Seeding lineal para otros tamaños
    seeding = Array.from({ length: size }, (_, i) => i);
  }

  // Primera ronda del bracket
  let tableNumber = 1;
  for (let i = 0; i < seeding.length; i += 2) {
    const player1 = topPlayers[seeding[i]];
    const player2 = topPlayers[seeding[i + 1]];

    matches.push({
      id: `top-${startingRound}-${tableNumber}`,
      round: startingRound,
      table: tableNumber,
      player1Id: player1?.id || null,
      player2Id: player2?.id || null,
      player1Wins: 0,
      player2Wins: 0,
      draws: 0,
      winnerId: null,
      isBye: !player1 || !player2,
      status: 'PENDING',
    });
    tableNumber++;
  }

  return matches;
}

// ==================== UTILIDADES ====================

/**
 * Formatea porcentaje para mostrar
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Crea un nuevo jugador con valores iniciales
 */
export function createPlayer(
  id: string,
  name: string,
  seed: number
): Player {
  return {
    id,
    name,
    matchPoints: 0,
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,
    gameWins: 0,
    gameLosses: 0,
    opponentMatchWinPct: 0,
    gameWinPct: 0,
    opponentGameWinPct: 0,
    opponents: [],
    hasBye: false,
    dropped: false,
    seed,
  };
}

/**
 * Valida si se puede iniciar una nueva ronda
 */
export function canStartNextRound(
  matches: Match[],
  currentRound: number,
  totalRounds: number
): { canStart: boolean; reason?: string } {
  if (currentRound >= totalRounds) {
    return { canStart: false, reason: 'Todas las rondas han sido completadas' };
  }

  if (currentRound > 0 && !isRoundComplete(matches, currentRound)) {
    return { canStart: false, reason: 'La ronda actual no ha terminado' };
  }

  return { canStart: true };
}

/**
 * Obtiene el estado resumido del torneo
 */
export function getTournamentSummary(
  players: Map<string, Player>,
  matches: Match[],
  currentRound: number,
  totalRounds: number
): {
  totalPlayers: number;
  activePlayers: number;
  droppedPlayers: number;
  completedRounds: number;
  pendingMatches: number;
  inProgressMatches: number;
} {
  const playerArray = Array.from(players.values());
  const currentRoundMatches = matches.filter(m => m.round === currentRound);

  return {
    totalPlayers: playerArray.length,
    activePlayers: playerArray.filter(p => !p.dropped).length,
    droppedPlayers: playerArray.filter(p => p.dropped).length,
    completedRounds: currentRound > 0 && isRoundComplete(matches, currentRound)
      ? currentRound
      : currentRound - 1,
    pendingMatches: currentRoundMatches.filter(m => m.status === 'PENDING').length,
    inProgressMatches: currentRoundMatches.filter(m => m.status === 'IN_PROGRESS').length,
  };
}
