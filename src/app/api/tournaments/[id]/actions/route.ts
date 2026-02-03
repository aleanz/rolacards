import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import {
  calculateSwissRounds,
  createPlayer,
  generatePairings,
  processMatchResult,
  updateAllTiebreakers,
  generateStandings,
  isRoundComplete,
  getTopCutPlayers,
  generateTopCutBracket,
  type Player,
  type Match,
} from '@/lib/swiss-tournament';

// Helper para obtener nombre del jugador (usuario del sistema o externo)
function getParticipantName(p: { User?: { name: string } | null; externalName?: string | null }): string {
  return p.User?.name || p.externalName || 'Jugador Desconocido';
}

// POST - Ejecutar acción en torneo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        Participants: {
          include: {
            User: { select: { id: true, name: true } },
          },
        },
        Matches: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'start':
        return handleStartTournament(tournament);

      case 'next_round':
        return handleNextRound(tournament);

      case 'report_result':
        return handleReportResult(tournament, body);

      case 'drop_player':
        return handleDropPlayer(tournament, body);

      case 'start_top_cut':
        return handleStartTopCut(tournament);

      case 'get_standings':
        return handleGetStandings(tournament);

      case 'add_player':
        return handleAddPlayer(tournament, body);

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error executing tournament action:', error);
    return NextResponse.json(
      { error: 'Error al ejecutar acción' },
      { status: 500 }
    );
  }
}

// Iniciar torneo
async function handleStartTournament(tournament: TournamentWithRelations) {
  if (tournament.status !== 'REGISTRATION' && tournament.status !== 'READY') {
    return NextResponse.json(
      { error: 'El torneo ya ha iniciado o está cancelado' },
      { status: 400 }
    );
  }

  const playerCount = tournament.Participants.filter(p => !p.dropped).length;

  if (playerCount < 4) {
    return NextResponse.json(
      { error: 'Se necesitan al menos 4 jugadores para iniciar' },
      { status: 400 }
    );
  }

  // Calcular rondas según participantes y tier
  const { rounds, topCut } = calculateSwissRounds(
    playerCount,
    tournament.tier as 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'
  );

  // Actualizar torneo
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      status: 'IN_PROGRESS',
      totalRounds: rounds,
      currentRound: 0,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: 'Torneo iniciado',
    totalRounds: rounds,
    topCut,
    playerCount,
  });
}

// Generar siguiente ronda
async function handleNextRound(tournament: TournamentWithRelations) {
  if (tournament.status !== 'IN_PROGRESS') {
    return NextResponse.json(
      { error: 'El torneo no está en progreso' },
      { status: 400 }
    );
  }

  // Verificar que la ronda actual esté completa
  if (tournament.currentRound > 0) {
    const currentRoundMatches = tournament.Matches.filter(
      m => m.round === tournament.currentRound
    );
    const allFinished = currentRoundMatches.every(
      m => m.status === 'FINISHED' || m.status === 'NO_SHOW'
    );

    if (!allFinished) {
      return NextResponse.json(
        { error: 'La ronda actual no ha terminado' },
        { status: 400 }
      );
    }
  }

  // Verificar si hay más rondas
  if (tournament.currentRound >= tournament.totalRounds) {
    return NextResponse.json(
      { error: 'Todas las rondas han sido completadas. Inicia el Top Cut si aplica.' },
      { status: 400 }
    );
  }

  const nextRound = tournament.currentRound + 1;

  // Construir mapa de jugadores
  const playersMap = new Map<string, Player>();
  for (const p of tournament.Participants) {
    if (p.dropped) continue;

    const player = createPlayer(p.id, getParticipantName(p), p.seed);
    player.matchPoints = p.matchPoints;
    player.matchWins = p.matchWins;
    player.matchLosses = p.matchLosses;
    player.matchDraws = p.matchDraws;
    player.gameWins = p.gameWins;
    player.gameLosses = p.gameLosses;
    player.hasBye = p.hasBye;
    player.opponentMatchWinPct = p.opponentMatchWinPct;
    player.gameWinPct = p.gameWinPct;
    player.opponentGameWinPct = p.opponentGameWinPct;

    // Reconstruir lista de oponentes desde matches
    const playerMatches = tournament.Matches.filter(
      m => (m.player1Id === p.id || m.player2Id === p.id) && m.status === 'FINISHED'
    );
    for (const match of playerMatches) {
      if (match.player1Id === p.id && match.player2Id) {
        player.opponents.push(match.player2Id);
      } else if (match.player2Id === p.id && match.player1Id) {
        player.opponents.push(match.player1Id);
      }
    }

    playersMap.set(p.id, player);
  }

  // Generar emparejamientos
  const pairings = generatePairings(playersMap, nextRound, tournament.totalRounds);

  // Guardar matches en BD
  const matchesData = pairings.map((match, index) => ({
    id: randomUUID(),
    tournamentId: tournament.id,
    round: nextRound,
    table: match.isBye ? 0 : index + 1,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    player1Wins: match.player1Wins,
    player2Wins: match.player2Wins,
    draws: match.draws,
    winnerId: match.winnerId,
    isBye: match.isBye,
    status: match.status,
    startedAt: new Date(),
  }));

  await prisma.tournamentMatch.createMany({
    data: matchesData,
  });

  // Actualizar jugador con bye si existe
  const byeMatch = pairings.find(m => m.isBye);
  if (byeMatch && byeMatch.player1Id) {
    const byePlayer = playersMap.get(byeMatch.player1Id);
    if (byePlayer) {
      await prisma.tournamentPlayer.update({
        where: { id: byeMatch.player1Id },
        data: {
          hasBye: true,
          matchWins: byePlayer.matchWins + 1,
          matchPoints: byePlayer.matchPoints + 3,
          gameWins: byePlayer.gameWins + 2,
        },
      });
    }
  }

  // Actualizar ronda actual
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      currentRound: nextRound,
      updatedAt: new Date(),
    },
  });

  // Obtener matches creados con relaciones
  const createdMatches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId: tournament.id,
      round: nextRound,
    },
    include: {
      Player1: {
        include: { User: { select: { name: true } } },
      },
      Player2: {
        include: { User: { select: { name: true } } },
      },
    },
    orderBy: { table: 'asc' },
  });

  return NextResponse.json({
    message: `Ronda ${nextRound} generada`,
    round: nextRound,
    matches: createdMatches,
  });
}

// Reportar resultado de match
async function handleReportResult(
  tournament: TournamentWithRelations,
  body: { matchId: string; player1Wins: number; player2Wins: number; draws?: number }
) {
  const { matchId, player1Wins, player2Wins, draws = 0 } = body;

  if (!matchId) {
    return NextResponse.json(
      { error: 'matchId es requerido' },
      { status: 400 }
    );
  }

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    include: {
      Player1: true,
      Player2: true,
    },
  });

  if (!match) {
    return NextResponse.json(
      { error: 'Match no encontrado' },
      { status: 404 }
    );
  }

  if (match.status === 'FINISHED') {
    return NextResponse.json(
      { error: 'El match ya ha sido reportado' },
      { status: 400 }
    );
  }

  // Determinar ganador
  let winnerId: string | null = null;
  if (player1Wins > player2Wins) {
    winnerId = match.player1Id;
  } else if (player2Wins > player1Wins) {
    winnerId = match.player2Id;
  }
  // Si empate, winnerId = null (doble derrota según reglas v2.5)

  // Actualizar match
  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      player1Wins,
      player2Wins,
      draws,
      winnerId,
      status: 'FINISHED',
      finishedAt: new Date(),
    },
  });

  // Actualizar estadísticas de jugadores
  if (match.Player1 && match.player1Id) {
    const p1Updates: Record<string, number> = {
      gameWins: match.Player1.gameWins + player1Wins,
      gameLosses: match.Player1.gameLosses + player2Wins,
    };

    if (player1Wins > player2Wins) {
      p1Updates.matchWins = match.Player1.matchWins + 1;
      p1Updates.matchPoints = match.Player1.matchPoints + 3;
    } else if (player2Wins > player1Wins) {
      p1Updates.matchLosses = match.Player1.matchLosses + 1;
    } else {
      // Empate = doble derrota
      p1Updates.matchLosses = match.Player1.matchLosses + 1;
    }

    await prisma.tournamentPlayer.update({
      where: { id: match.player1Id },
      data: p1Updates,
    });
  }

  if (match.Player2 && match.player2Id) {
    const p2Updates: Record<string, number> = {
      gameWins: match.Player2.gameWins + player2Wins,
      gameLosses: match.Player2.gameLosses + player1Wins,
    };

    if (player2Wins > player1Wins) {
      p2Updates.matchWins = match.Player2.matchWins + 1;
      p2Updates.matchPoints = match.Player2.matchPoints + 3;
    } else if (player1Wins > player2Wins) {
      p2Updates.matchLosses = match.Player2.matchLosses + 1;
    } else {
      // Empate = doble derrota
      p2Updates.matchLosses = match.Player2.matchLosses + 1;
    }

    await prisma.tournamentPlayer.update({
      where: { id: match.player2Id },
      data: p2Updates,
    });
  }

  // Recalcular tiebreakers para todos los jugadores
  await recalculateTiebreakers(tournament.id);

  return NextResponse.json({
    message: 'Resultado registrado',
    winnerId,
  });
}

// Drop de jugador
async function handleDropPlayer(
  tournament: TournamentWithRelations,
  body: { playerId: string }
) {
  const { playerId } = body;

  if (!playerId) {
    return NextResponse.json(
      { error: 'playerId es requerido' },
      { status: 400 }
    );
  }

  const player = await prisma.tournamentPlayer.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    return NextResponse.json(
      { error: 'Jugador no encontrado' },
      { status: 404 }
    );
  }

  await prisma.tournamentPlayer.update({
    where: { id: playerId },
    data: {
      dropped: true,
      droppedAtRound: tournament.currentRound,
    },
  });

  return NextResponse.json({
    message: 'Jugador dado de baja',
    playerId,
    droppedAtRound: tournament.currentRound,
  });
}

// Iniciar Top Cut
async function handleStartTopCut(tournament: TournamentWithRelations) {
  if (tournament.status !== 'IN_PROGRESS') {
    return NextResponse.json(
      { error: 'El torneo debe estar en progreso' },
      { status: 400 }
    );
  }

  // Verificar que todas las rondas suizas estén completas
  if (tournament.currentRound < tournament.totalRounds) {
    return NextResponse.json(
      { error: 'Las rondas suizas no han terminado' },
      { status: 400 }
    );
  }

  const playerCount = tournament.Participants.filter(p => !p.dropped).length;
  const { topCut } = calculateSwissRounds(
    playerCount,
    tournament.tier as 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4'
  );

  if (topCut === 0) {
    // Finalizar torneo sin Top Cut
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        status: 'FINISHED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Torneo finalizado (sin Top Cut)',
      topCut: 0,
    });
  }

  // Obtener standings actualizados
  await recalculateTiebreakers(tournament.id);

  const topPlayers = await prisma.tournamentPlayer.findMany({
    where: {
      tournamentId: tournament.id,
      dropped: false,
    },
    orderBy: [
      { matchPoints: 'desc' },
      { opponentMatchWinPct: 'desc' },
      { gameWinPct: 'desc' },
      { opponentGameWinPct: 'desc' },
      { seed: 'asc' },
    ],
    take: topCut,
    include: {
      User: { select: { name: true } },
    },
  });

  // Generar bracket de eliminación
  const playersForBracket: Player[] = topPlayers.map((p, i) => ({
    id: p.id,
    name: getParticipantName(p),
    matchPoints: p.matchPoints,
    matchWins: p.matchWins,
    matchLosses: p.matchLosses,
    matchDraws: p.matchDraws,
    gameWins: p.gameWins,
    gameLosses: p.gameLosses,
    opponentMatchWinPct: p.opponentMatchWinPct,
    gameWinPct: p.gameWinPct,
    opponentGameWinPct: p.opponentGameWinPct,
    opponents: [],
    hasBye: false,
    dropped: false,
    seed: i + 1,
  }));

  const topCutRound = tournament.totalRounds + 1;
  const bracketMatches = generateTopCutBracket(playersForBracket, topCutRound);

  // Guardar matches del bracket
  const matchesData = bracketMatches.map((match, index) => ({
    id: randomUUID(),
    tournamentId: tournament.id,
    round: topCutRound,
    table: index + 1,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    player1Wins: 0,
    player2Wins: 0,
    draws: 0,
    winnerId: null,
    isBye: match.isBye,
    status: 'PENDING' as const,
  }));

  await prisma.tournamentMatch.createMany({
    data: matchesData,
  });

  // Actualizar torneo
  await prisma.tournament.update({
    where: { id: tournament.id },
    data: {
      status: 'TOP_CUT',
      currentRound: topCutRound,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    message: `Top ${topCut} iniciado`,
    topCut,
    round: topCutRound,
    players: topPlayers.map(p => ({
      id: p.id,
      name: getParticipantName(p),
      matchPoints: p.matchPoints,
    })),
  });
}

// Obtener standings
async function handleGetStandings(tournament: TournamentWithRelations) {
  await recalculateTiebreakers(tournament.id);

  const players = await prisma.tournamentPlayer.findMany({
    where: { tournamentId: tournament.id },
    include: {
      User: { select: { id: true, name: true, konamiId: true } },
    },
    orderBy: [
      { matchPoints: 'desc' },
      { opponentMatchWinPct: 'desc' },
      { gameWinPct: 'desc' },
      { opponentGameWinPct: 'desc' },
      { seed: 'asc' },
    ],
  });

  const standings = players.map((p, index) => ({
    rank: index + 1,
    playerId: p.id,
    userId: p.userId,
    playerName: p.User?.name || p.externalName || 'Jugador Desconocido',
    konamiId: p.User?.konamiId || p.externalKonamiId,
    isExternal: !p.User && (p.externalName || p.externalKonamiId),
    matchPoints: p.matchPoints,
    record: `${p.matchWins}-${p.matchLosses}-${p.matchDraws}`,
    omwPct: Math.round(p.opponentMatchWinPct * 10000) / 100,
    gwPct: Math.round(p.gameWinPct * 10000) / 100,
    ogwPct: Math.round(p.opponentGameWinPct * 10000) / 100,
    dropped: p.dropped,
  }));

  return NextResponse.json({ standings });
}

// Agregar jugador manualmente
async function handleAddPlayer(
  tournament: TournamentWithRelations,
  body: { userId: string; deckId?: string }
) {
  const { userId, deckId } = body;

  if (!userId) {
    return NextResponse.json(
      { error: 'userId es requerido' },
      { status: 400 }
    );
  }

  // Verificar que el torneo esté en registro
  if (tournament.status !== 'REGISTRATION' && tournament.status !== 'READY') {
    return NextResponse.json(
      { error: 'Solo se pueden agregar jugadores durante el registro' },
      { status: 400 }
    );
  }

  // Verificar que el usuario no esté ya registrado
  const existingPlayer = await prisma.tournamentPlayer.findFirst({
    where: {
      tournamentId: tournament.id,
      userId,
    },
  });

  if (existingPlayer) {
    return NextResponse.json(
      { error: 'El jugador ya está registrado' },
      { status: 400 }
    );
  }

  // Verificar capacidad máxima
  if (tournament.maxPlayers) {
    const currentCount = tournament.Participants.filter(p => !p.dropped).length;
    if (currentCount >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: 'El torneo ha alcanzado la capacidad máxima' },
        { status: 400 }
      );
    }
  }

  const nextSeed = tournament.Participants.length + 1;

  const player = await prisma.tournamentPlayer.create({
    data: {
      id: randomUUID(),
      tournamentId: tournament.id,
      userId,
      deckId,
      seed: nextSeed,
    },
    include: {
      User: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    message: 'Jugador agregado',
    player,
  });
}

// Recalcular tiebreakers
async function recalculateTiebreakers(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      Participants: true,
      Matches: {
        where: { status: 'FINISHED' },
      },
    },
  });

  if (!tournament) return;

  // Construir mapa de jugadores
  const playersMap = new Map<string, Player>();
  for (const p of tournament.Participants) {
    const player = createPlayer(p.id, '', p.seed);
    player.matchPoints = p.matchPoints;
    player.matchWins = p.matchWins;
    player.matchLosses = p.matchLosses;
    player.matchDraws = p.matchDraws;
    player.gameWins = p.gameWins;
    player.gameLosses = p.gameLosses;
    player.hasBye = p.hasBye;

    // Reconstruir lista de oponentes
    for (const match of tournament.Matches) {
      if (match.player1Id === p.id && match.player2Id) {
        player.opponents.push(match.player2Id);
      } else if (match.player2Id === p.id && match.player1Id) {
        player.opponents.push(match.player1Id);
      }
    }

    playersMap.set(p.id, player);
  }

  // Calcular tiebreakers
  updateAllTiebreakers(playersMap, tournament.totalRounds || tournament.currentRound);

  // Actualizar en BD
  const updates = Array.from(playersMap.values()).map(player =>
    prisma.tournamentPlayer.update({
      where: { id: player.id },
      data: {
        opponentMatchWinPct: player.opponentMatchWinPct,
        gameWinPct: player.gameWinPct,
        opponentGameWinPct: player.opponentGameWinPct,
      },
    })
  );

  await Promise.all(updates);
}

// Tipos
type TournamentWithRelations = NonNullable<
  Awaited<ReturnType<typeof prisma.tournament.findUnique>>
> & {
  Participants: Array<{
    id: string;
    matchPoints: number;
    matchWins: number;
    matchLosses: number;
    matchDraws: number;
    gameWins: number;
    gameLosses: number;
    opponentMatchWinPct: number;
    gameWinPct: number;
    opponentGameWinPct: number;
    hasBye: boolean;
    dropped: boolean;
    seed: number;
    player1Id?: string;
    player2Id?: string;
    externalName?: string | null;
    externalKonamiId?: string | null;
    User: { id: string; name: string } | null;
  }>;
  Matches: Array<{
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
    status: string;
  }>;
};
