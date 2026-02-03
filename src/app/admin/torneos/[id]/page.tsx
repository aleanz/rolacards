'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Trophy,
  Users,
  Swords,
  Play,
  ChevronLeft,
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserMinus,
  Medal,
  ArrowRight,
  Loader2,
  UserPlus,
  Search,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Tooltip } from '@/components/ui/Tooltip';

type TournamentStatus = 'REGISTRATION' | 'READY' | 'IN_PROGRESS' | 'TOP_CUT' | 'FINISHED' | 'CANCELLED';
type MatchStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED' | 'NO_SHOW';

interface Player {
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
  droppedAtRound: number | null;
  seed: number;
  externalName?: string | null;
  externalKonamiId?: string | null;
  User?: {
    id: string;
    name: string;
    email?: string;
    konamiId?: string | null;
  } | null;
  Deck?: {
    id: string;
    name: string;
    format: string | null;
  } | null;
}

// Helper para obtener nombre del jugador (usuario o externo)
const getPlayerName = (player: Player) => {
  return player.User?.name || player.externalName || 'Jugador Desconocido';
};

// Helper para obtener Konami ID del jugador
const getPlayerKonamiId = (player: Player) => {
  return player.User?.konamiId || player.externalKonamiId || null;
};

// Helper para saber si es jugador externo
const isExternalPlayer = (player: Player) => {
  return !player.User && (player.externalName || player.externalKonamiId);
};

interface Match {
  id: string;
  round: number;
  table: number;
  player1Wins: number;
  player2Wins: number;
  draws: number;
  winnerId: string | null;
  isBye: boolean;
  status: MatchStatus;
  startedAt: string | null;
  finishedAt: string | null;
  Player1: Player | null;
  Player2: Player | null;
  Winner: Player | null;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  format: string | null;
  date: string;
  location: string | null;
  entryFee: string | null;
  maxPlayers: number | null;
  prizeInfo: string | null;
  imageUrl: string | null;
  status: TournamentStatus;
  currentRound: number;
  totalRounds: number;
  roundTimeMinutes: number;
  tier: string;
  Creator: { id: string; name: string; email: string };
  Participants: Player[];
  Matches: Match[];
}

interface Standing {
  rank: number;
  playerId: string;
  userId: string;
  playerName: string;
  konamiId: string | null;
  matchPoints: number;
  record: string;
  omwPct: number;
  gwPct: number;
  ogwPct: number;
  dropped: boolean;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  konamiId: string | null;
  Deck: {
    id: string;
    name: string;
    format: string | null;
  }[];
}

const STATUS_LABELS: Record<TournamentStatus, { label: string; color: string }> = {
  REGISTRATION: { label: 'Registro abierto', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  READY: { label: 'Listo para iniciar', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  IN_PROGRESS: { label: 'En progreso', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  TOP_CUT: { label: 'Top Cut', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  FINISHED: { label: 'Finalizado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'players'>('matches');
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [reportingMatch, setReportingMatch] = useState<Match | null>(null);
  const [matchResult, setMatchResult] = useState({ player1Wins: 0, player2Wins: 0 });

  // Estado para agregar jugador
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [addPlayerMode, setAddPlayerMode] = useState<'search' | 'external'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  // Estado para jugador externo
  const [externalName, setExternalName] = useState('');
  const [externalKonamiId, setExternalKonamiId] = useState('');
  // Estado para editar jugador
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editName, setEditName] = useState('');
  const [editKonamiId, setEditKonamiId] = useState('');

  const fetchTournament = useCallback(async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`);
      if (response.ok) {
        const data = await response.json();
        setTournament(data);
        setSelectedRound(data.currentRound || 1);
      } else {
        toast.error('Error al cargar el torneo');
        router.push('/admin/torneos');
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast.error('Error al cargar el torneo');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, router]);

  const fetchStandings = useCallback(async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_standings' }),
      });
      if (response.ok) {
        const data = await response.json();
        setStandings(data.standings);
      }
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  useEffect(() => {
    if (tournament && tournament.currentRound > 0) {
      fetchStandings();
    }
  }, [tournament, fetchStandings]);

  // Buscar usuarios para agregar
  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const format = tournament?.format || '';
      const response = await fetch(
        `/api/tournaments/${tournamentId}/players?search=${encodeURIComponent(query)}&format=${format}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, [tournamentId, tournament?.format]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleAddPlayer = async () => {
    // Validar según el modo
    if (addPlayerMode === 'search' && !selectedUser) return;
    if (addPlayerMode === 'external' && (!externalName.trim() || !externalKonamiId.trim())) {
      toast.error('Nombre y Konami ID son requeridos para jugadores externos');
      return;
    }

    setIsProcessing(true);
    try {
      const body = addPlayerMode === 'search'
        ? {
            userId: selectedUser!.id,
            deckId: selectedDeckId || null,
          }
        : {
            externalName: externalName.trim(),
            externalKonamiId: externalKonamiId.trim(),
          };

      const response = await fetch(`/api/tournaments/${tournamentId}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al agregar jugador');
      }

      const playerName = addPlayerMode === 'search' ? selectedUser!.name : externalName;
      toast.success(`${playerName} agregado al torneo`);
      closeAddPlayerModal();
      fetchTournament();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al agregar jugador');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeAddPlayerModal = () => {
    setIsAddPlayerModalOpen(false);
    setAddPlayerMode('search');
    setSelectedUser(null);
    setSelectedDeckId('');
    setSearchQuery('');
    setSearchResults([]);
    setExternalName('');
    setExternalKonamiId('');
  };

  const handleDeletePlayer = async (player: Player) => {
    const playerName = getPlayerName(player);
    if (!confirm(`¿Estás seguro de eliminar a ${playerName} del torneo?`)) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players/${player.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar jugador');
      }

      toast.success(data.message);
      fetchTournament();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar jugador');
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditPlayerModal = (player: Player) => {
    setEditingPlayer(player);
    setEditName(player.externalName || '');
    setEditKonamiId(player.externalKonamiId || '');
  };

  const closeEditPlayerModal = () => {
    setEditingPlayer(null);
    setEditName('');
    setEditKonamiId('');
  };

  const handleEditPlayer = async () => {
    if (!editingPlayer) return;
    if (!editName.trim() || !editKonamiId.trim()) {
      toast.error('Nombre y Konami ID son requeridos');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/players/${editingPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalName: editName.trim(),
          externalKonamiId: editKonamiId.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar jugador');
      }

      toast.success('Jugador actualizado correctamente');
      closeEditPlayerModal();
      fetchTournament();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar jugador');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = async (action: string, body: Record<string, unknown> = {}) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al ejecutar acción');
      }

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTournament = async () => {
    if (!confirm('¿Iniciar el torneo? Esto calculará las rondas necesarias según los participantes.')) return;

    toast.promise(
      executeAction('start').then((data) => {
        fetchTournament();
        return data;
      }),
      {
        loading: 'Iniciando torneo...',
        success: (data) => `Torneo iniciado. ${data.totalRounds} rondas suizas, Top ${data.topCut || 'N/A'}`,
        error: (err) => err.message,
      }
    );
  };

  const handleNextRound = async () => {
    if (!confirm('¿Generar emparejamientos para la siguiente ronda?')) return;

    toast.promise(
      executeAction('next_round').then((data) => {
        fetchTournament();
        fetchStandings();
        setSelectedRound(data.round);
        return data;
      }),
      {
        loading: 'Generando ronda...',
        success: (data) => `Ronda ${data.round} generada`,
        error: (err) => err.message,
      }
    );
  };

  const handleReportResult = async () => {
    if (!reportingMatch) return;

    toast.promise(
      executeAction('report_result', {
        matchId: reportingMatch.id,
        player1Wins: matchResult.player1Wins,
        player2Wins: matchResult.player2Wins,
      }).then(() => {
        setReportingMatch(null);
        setMatchResult({ player1Wins: 0, player2Wins: 0 });
        fetchTournament();
        fetchStandings();
      }),
      {
        loading: 'Reportando resultado...',
        success: 'Resultado registrado',
        error: (err) => err.message,
      }
    );
  };

  const handleDropPlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`¿Dar de baja a ${playerName}? No podrá volver a participar en este torneo.`)) return;

    toast.promise(
      executeAction('drop_player', { playerId }).then(() => {
        fetchTournament();
        fetchStandings();
      }),
      {
        loading: 'Procesando...',
        success: `${playerName} dado de baja`,
        error: (err) => err.message,
      }
    );
  };

  const handleStartTopCut = async () => {
    if (!confirm('¿Iniciar el Top Cut? Asegúrate de que todas las rondas suizas hayan terminado.')) return;

    toast.promise(
      executeAction('start_top_cut').then((data) => {
        fetchTournament();
        fetchStandings();
        return data;
      }),
      {
        loading: 'Iniciando Top Cut...',
        success: (data) => `Top ${data.topCut} iniciado`,
        error: (err) => err.message,
      }
    );
  };

  const handleFinishTournament = async () => {
    if (!confirm('¿Finalizar el torneo?')) return;

    try {
      await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'FINISHED' }),
      });
      toast.success('Torneo finalizado');
      fetchTournament();
    } catch (error) {
      toast.error('Error al finalizar torneo');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando torneo...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Torneo no encontrado</p>
      </div>
    );
  }

  const currentRoundMatches = tournament.Matches.filter((m) => m.round === selectedRound);
  const allCurrentRoundFinished = currentRoundMatches.every((m) => m.status === 'FINISHED' || m.status === 'NO_SHOW');
  const activePlayers = tournament.Participants.filter((p) => !p.dropped);
  const isAdmin = session?.user?.role === 'ADMIN';

  const roundNumbers = Array.from(new Set(tournament.Matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/torneos')} className="btn btn-ghost btn-sm">
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      {/* Tournament Info Card */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {tournament.imageUrl && (
            <img
              src={tournament.imageUrl}
              alt={tournament.name}
              className="w-full lg:w-64 h-48 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{tournament.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full border ${STATUS_LABELS[tournament.status].color}`}>
                    {tournament.status === 'IN_PROGRESS' && <Play className="w-4 h-4" />}
                    {tournament.status === 'TOP_CUT' && <Trophy className="w-4 h-4" />}
                    {tournament.status === 'FINISHED' && <CheckCircle className="w-4 h-4" />}
                    {STATUS_LABELS[tournament.status].label}
                  </span>
                  {tournament.format && (
                    <span className="px-3 py-1 text-sm rounded-full bg-purple-500/20 text-purple-400">
                      {tournament.format}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{new Date(tournament.date).toLocaleDateString('es-MX')}</span>
              </div>
              {tournament.location && (
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{tournament.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">{activePlayers.length} jugadores activos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{tournament.roundTimeMinutes} min/ronda</span>
              </div>
            </div>

            {/* Progress */}
            {tournament.totalRounds > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Progreso</span>
                  <span className="text-white">
                    Ronda {tournament.currentRound} de {tournament.totalRounds}
                  </span>
                </div>
                <div className="w-full h-2 bg-rola-gray rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rola-gold transition-all duration-300"
                    style={{ width: `${(tournament.currentRound / tournament.totalRounds) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {(tournament.status === 'REGISTRATION' || tournament.status === 'READY') && (
                  <Tooltip
                    content={activePlayers.length < 4 ? `Se necesitan al menos 4 jugadores (${activePlayers.length}/4)` : null}
                    side="bottom"
                  >
                    <button
                      onClick={handleStartTournament}
                      disabled={isProcessing || activePlayers.length < 4}
                      className={`btn btn-primary ${activePlayers.length < 4 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Iniciar Torneo
                    </button>
                  </Tooltip>
                )}

                {tournament.status === 'IN_PROGRESS' && tournament.currentRound < tournament.totalRounds && allCurrentRoundFinished && (
                  <button onClick={handleNextRound} disabled={isProcessing} className="btn btn-primary">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Siguiente Ronda
                  </button>
                )}

                {tournament.status === 'IN_PROGRESS' && tournament.currentRound === 0 && (
                  <button onClick={handleNextRound} disabled={isProcessing} className="btn btn-primary">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
                    Generar Ronda 1
                  </button>
                )}

                {tournament.status === 'IN_PROGRESS' && tournament.currentRound >= tournament.totalRounds && allCurrentRoundFinished && (
                  <button onClick={handleStartTopCut} disabled={isProcessing} className="btn btn-primary">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                    Iniciar Top Cut
                  </button>
                )}

                {(tournament.status === 'TOP_CUT' && allCurrentRoundFinished) && (
                  <button onClick={handleFinishTournament} className="btn btn-primary">
                    <CheckCircle className="w-4 h-4" />
                    Finalizar Torneo
                  </button>
                )}

                <button onClick={() => { fetchTournament(); fetchStandings(); }} className="btn btn-ghost">
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-rola-gray">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'matches'
              ? 'border-rola-gold text-rola-gold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Swords className="w-4 h-4 inline mr-2" />
          Matches
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'standings'
              ? 'border-rola-gold text-rola-gold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Medal className="w-4 h-4 inline mr-2" />
          Standings
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'players'
              ? 'border-rola-gold text-rola-gold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Jugadores ({tournament.Participants.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Round Selector */}
          {roundNumbers.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {roundNumbers.map((round) => (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRound === round
                      ? 'bg-rola-gold text-black'
                      : 'bg-rola-gray text-gray-400 hover:bg-rola-gray/80'
                  }`}
                >
                  Ronda {round}
                  {round > tournament.totalRounds && ' (Top Cut)'}
                </button>
              ))}
            </div>
          )}

          {/* Matches Grid */}
          {currentRoundMatches.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {currentRoundMatches.map((match) => (
                <div
                  key={match.id}
                  className={`card p-4 ${match.isBye ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">
                      {match.isBye ? 'BYE' : `Mesa ${match.table}`}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        match.status === 'FINISHED'
                          ? 'bg-green-500/20 text-green-400'
                          : match.status === 'IN_PROGRESS'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {match.status === 'FINISHED' ? 'Terminado' : match.status === 'IN_PROGRESS' ? 'En curso' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Player 1 */}
                    <div
                      className={`flex items-center justify-between p-2 rounded ${
                        match.winnerId === match.Player1?.id ? 'bg-green-500/10 border border-green-500/30' : 'bg-rola-gray/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">#{match.Player1?.seed || '-'}</span>
                        <span className="text-white font-medium">{match.Player1 ? getPlayerName(match.Player1) : 'BYE'}</span>
                        {match.winnerId === match.Player1?.id && <CheckCircle className="w-4 h-4 text-green-400" />}
                      </div>
                      <span className="text-lg font-bold text-white">{match.player1Wins}</span>
                    </div>

                    {/* VS */}
                    {!match.isBye && (
                      <>
                        <div className="text-center text-gray-500 text-xs">VS</div>

                        {/* Player 2 */}
                        <div
                          className={`flex items-center justify-between p-2 rounded ${
                            match.winnerId === match.Player2?.id ? 'bg-green-500/10 border border-green-500/30' : 'bg-rola-gray/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">#{match.Player2?.seed || '-'}</span>
                            <span className="text-white font-medium">{match.Player2 ? getPlayerName(match.Player2) : 'TBD'}</span>
                            {match.winnerId === match.Player2?.id && <CheckCircle className="w-4 h-4 text-green-400" />}
                          </div>
                          <span className="text-lg font-bold text-white">{match.player2Wins}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Report Button */}
                  {!match.isBye && match.status !== 'FINISHED' && isAdmin && (
                    <button
                      onClick={() => {
                        setReportingMatch(match);
                        setMatchResult({ player1Wins: 0, player2Wins: 0 });
                      }}
                      className="w-full mt-3 btn btn-primary btn-sm"
                    >
                      Reportar Resultado
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card">
              <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {tournament.currentRound === 0
                  ? 'El torneo aún no ha iniciado. Genera la primera ronda.'
                  : 'No hay matches para esta ronda'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'standings' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rola-gray/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Jugador</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Pts</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Record</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">OMW%</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">GW%</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">OGW%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rola-gray/30">
                {standings.map((standing) => (
                  <tr
                    key={standing.playerId}
                    className={`${standing.dropped ? 'opacity-50' : ''} ${standing.rank <= 8 ? 'bg-rola-gold/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {standing.rank <= 3 && (
                          <Medal
                            className={`w-4 h-4 ${
                              standing.rank === 1
                                ? 'text-yellow-400'
                                : standing.rank === 2
                                ? 'text-gray-400'
                                : 'text-orange-400'
                            }`}
                          />
                        )}
                        <span className="text-white font-medium">{standing.rank}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-white">{standing.playerName}</span>
                        {standing.dropped && (
                          <span className="ml-2 text-xs text-red-400">(DROP)</span>
                        )}
                        {standing.konamiId && (
                          <span className="block text-xs text-gray-500">ID: {standing.konamiId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-rola-gold font-bold">{standing.matchPoints}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-white">{standing.record}</td>
                    <td className="px-4 py-3 text-center text-gray-400">{standing.omwPct.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center text-gray-400">{standing.gwPct.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-center text-gray-400">{standing.ogwPct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {standings.length === 0 && (
            <div className="text-center py-12">
              <Medal className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Los standings aparecerán cuando inicie el torneo</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'players' && (
        <div className="space-y-4">
          {/* Botón agregar jugador */}
          {isAdmin && (tournament.status === 'REGISTRATION' || tournament.status === 'READY') && (
            <div className="flex justify-end">
              <button
                onClick={() => setIsAddPlayerModalOpen(true)}
                className="btn btn-primary"
              >
                <UserPlus className="w-4 h-4" />
                Agregar Jugador
              </button>
            </div>
          )}

          <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-rola-gray/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Seed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Jugador</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Mazo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rola-gray/30">
                {tournament.Participants.sort((a, b) => a.seed - b.seed).map((player) => (
                  <tr key={player.id} className={player.dropped ? 'opacity-50' : ''}>
                    <td className="px-4 py-3">
                      <span className="text-gray-400">#{player.seed}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{getPlayerName(player)}</span>
                          {isExternalPlayer(player) && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Externo
                            </span>
                          )}
                        </div>
                        {getPlayerKonamiId(player) && (
                          <span className="block text-xs text-gray-500">Konami ID: {getPlayerKonamiId(player)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {player.Deck ? (
                        <div>
                          <span className="text-gray-300">{player.Deck.name}</span>
                          {player.Deck.format && (
                            <span className="block text-xs text-gray-500">{player.Deck.format}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500">{isExternalPlayer(player) ? 'N/A' : 'Sin mazo'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {player.dropped ? (
                        <span className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400">
                          DROP (R{player.droppedAtRound})
                        </span>
                      ) : player.hasBye ? (
                        <span className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-400">
                          Tuvo BYE
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botones antes de iniciar el torneo */}
                        {isAdmin && (tournament.status === 'REGISTRATION' || tournament.status === 'READY') && (
                          <>
                            {isExternalPlayer(player) && (
                              <Tooltip content="Editar jugador">
                                <button
                                  onClick={() => openEditPlayerModal(player)}
                                  className="btn btn-ghost btn-sm text-blue-400 hover:bg-blue-500/10"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip content="Eliminar del torneo">
                              <button
                                onClick={() => handleDeletePlayer(player)}
                                disabled={isProcessing}
                                className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </>
                        )}
                        {/* Botón de DROP durante el torneo */}
                        {!player.dropped && isAdmin && tournament.status === 'IN_PROGRESS' && (
                          <Tooltip content="Dar DROP">
                            <button
                              onClick={() => handleDropPlayer(player.id, getPlayerName(player))}
                              className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {isAddPlayerModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Agregar Jugador</h2>
              <button
                onClick={closeAddPlayerModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {tournament.format && (
              <p className="text-sm text-gray-400 mb-4">
                Formato del torneo: <span className="text-rola-gold font-medium">{tournament.format}</span>
              </p>
            )}

            {/* Tabs para elegir modo */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddPlayerMode('search')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  addPlayerMode === 'search'
                    ? 'bg-rola-gold text-black'
                    : 'bg-rola-gray/50 text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Usuario Registrado
              </button>
              <button
                onClick={() => setAddPlayerMode('external')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  addPlayerMode === 'external'
                    ? 'bg-rola-gold text-black'
                    : 'bg-rola-gray/50 text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Jugador Externo
              </button>
            </div>

            {/* Modo: Buscar Usuario Registrado */}
            {addPlayerMode === 'search' && (
              <>
                {!selectedUser ? (
                  <>
                    {/* Search Input */}
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, email o Konami ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                        autoFocus
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 animate-spin" />
                      )}
                    </div>

                    {/* Search Results */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                        <p className="text-center text-gray-500 py-4">
                          No se encontraron usuarios con Konami ID
                          {tournament.format && ` y mazos del formato ${tournament.format}`}
                        </p>
                      )}

                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            if (user.Deck.length === 1) {
                              setSelectedDeckId(user.Deck[0].id);
                            }
                          }}
                          className="w-full p-3 bg-rola-gray/30 hover:bg-rola-gray/50 rounded-lg text-left transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <p className="text-xs text-rola-gold">Konami ID: {user.konamiId}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-400">
                                {user.Deck.length} mazo{user.Deck.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}

                      {searchQuery.length < 2 && (
                        <p className="text-center text-gray-500 py-4">
                          Escribe al menos 2 caracteres para buscar
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Selected User */}
                    <div className="p-4 bg-rola-gray/30 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{selectedUser.name}</p>
                          <p className="text-xs text-gray-500">{selectedUser.email}</p>
                          <p className="text-xs text-rola-gold">Konami ID: {selectedUser.konamiId}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedUser(null);
                            setSelectedDeckId('');
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Deck Selection */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Seleccionar Mazo {tournament.format && `(${tournament.format})`}
                      </label>
                      {selectedUser.Deck.length > 0 ? (
                        <div className="space-y-2">
                          {selectedUser.Deck.map((deck) => (
                            <label
                              key={deck.id}
                              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedDeckId === deck.id
                                  ? 'bg-rola-gold/20 border border-rola-gold'
                                  : 'bg-rola-gray/30 border border-transparent hover:bg-rola-gray/50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="deck"
                                value={deck.id}
                                checked={selectedDeckId === deck.id}
                                onChange={(e) => setSelectedDeckId(e.target.value)}
                                className="sr-only"
                              />
                              <div className="flex-1">
                                <p className="text-white font-medium">{deck.name}</p>
                                {deck.format && (
                                  <p className="text-xs text-gray-500">{deck.format}</p>
                                )}
                              </div>
                              {selectedDeckId === deck.id && (
                                <CheckCircle className="w-5 h-5 text-rola-gold" />
                              )}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">
                          Este usuario no tiene mazos
                          {tournament.format && ` del formato ${tournament.format}`}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setSelectedDeckId('');
                        }}
                        className="flex-1 btn btn-ghost"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddPlayer}
                        disabled={isProcessing || (selectedUser.Deck.length > 0 && !selectedDeckId)}
                        className="flex-1 btn btn-primary"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        Agregar
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Modo: Jugador Externo */}
            {addPlayerMode === 'external' && (
              <>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                  <p className="text-blue-400 text-sm">
                    Agrega un jugador que no tiene cuenta en el sistema. Solo se registrará en este torneo.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre del Jugador *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Konami ID *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 1234567890"
                      value={externalKonamiId}
                      onChange={(e) => setExternalKonamiId(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El Konami ID es requerido para reportar resultados oficiales
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={closeAddPlayerModal}
                    className="flex-1 btn btn-ghost"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddPlayer}
                    disabled={isProcessing || !externalName.trim() || !externalKonamiId.trim()}
                    className="flex-1 btn btn-primary"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    Agregar Externo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Editar Jugador Externo</h2>
              <button
                onClick={closeEditPlayerModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Jugador *
                </label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Konami ID *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 1234567890"
                  value={editKonamiId}
                  onChange={(e) => setEditKonamiId(e.target.value)}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeEditPlayerModal}
                className="flex-1 btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditPlayer}
                disabled={isProcessing || !editName.trim() || !editKonamiId.trim()}
                className="flex-1 btn btn-primary"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Result Modal */}
      {reportingMatch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Reportar Resultado</h2>
            <p className="text-gray-400 text-sm mb-4">Mesa {reportingMatch.table} - Ronda {reportingMatch.round}</p>

            <div className="space-y-4">
              {/* Player 1 */}
              <div className="flex items-center justify-between p-3 bg-rola-gray/30 rounded-lg">
                <span className="text-white font-medium">{reportingMatch.Player1 ? getPlayerName(reportingMatch.Player1) : 'N/A'}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMatchResult((prev) => ({ ...prev, player1Wins: Math.max(0, prev.player1Wins - 1) }))}
                    className="btn btn-ghost btn-sm"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-8 text-center">{matchResult.player1Wins}</span>
                  <button
                    onClick={() => setMatchResult((prev) => ({ ...prev, player1Wins: Math.min(2, prev.player1Wins + 1) }))}
                    className="btn btn-ghost btn-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-center text-gray-500">VS</div>

              {/* Player 2 */}
              <div className="flex items-center justify-between p-3 bg-rola-gray/30 rounded-lg">
                <span className="text-white font-medium">{reportingMatch.Player2 ? getPlayerName(reportingMatch.Player2) : 'N/A'}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMatchResult((prev) => ({ ...prev, player2Wins: Math.max(0, prev.player2Wins - 1) }))}
                    className="btn btn-ghost btn-sm"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-white w-8 text-center">{matchResult.player2Wins}</span>
                  <button
                    onClick={() => setMatchResult((prev) => ({ ...prev, player2Wins: Math.min(2, prev.player2Wins + 1) }))}
                    className="btn btn-ghost btn-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Warning for draw */}
              {matchResult.player1Wins === matchResult.player2Wins && matchResult.player1Wins > 0 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Empate resultará en doble derrota (Policy v2.5)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setReportingMatch(null);
                  setMatchResult({ player1Wins: 0, player2Wins: 0 });
                }}
                className="flex-1 btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleReportResult}
                disabled={isProcessing || (matchResult.player1Wins === 0 && matchResult.player2Wins === 0)}
                className="flex-1 btn btn-primary"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
