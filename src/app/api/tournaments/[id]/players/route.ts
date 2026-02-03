import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// GET - Buscar usuarios disponibles para agregar al torneo
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tournamentId } = await params;

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const format = searchParams.get('format') || '';

    // Obtener IDs de usuarios ya registrados en el torneo
    const existingPlayers = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      select: { userId: true, externalKonamiId: true },
    });
    const existingUserIds = existingPlayers
      .filter(p => p.userId)
      .map(p => p.userId as string);

    // Buscar usuarios con Konami ID que no estén en el torneo
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: existingUserIds },
        konamiId: { not: null },
        role: 'CLIENTE',
        emailVerified: true,
        OR: search ? [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { konamiId: { contains: search, mode: 'insensitive' } },
        ] : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        konamiId: true,
        Deck: {
          where: {
            isActive: true,
            ...(format ? { format } : {}),
          },
          select: {
            id: true,
            name: true,
            format: true,
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });

    // Filtrar solo usuarios que tienen al menos un mazo del formato (si se especifica)
    const filteredUsers = format
      ? users.filter(u => u.Deck.length > 0)
      : users;

    return NextResponse.json(filteredUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Error al buscar usuarios' },
      { status: 500 }
    );
  }
}

// POST - Agregar jugador al torneo (usuario existente o jugador externo)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tournamentId } = await params;

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, deckId, externalName, externalKonamiId } = body;

    // Debe tener userId O datos de jugador externo
    const isExternalPlayer = !userId && externalName && externalKonamiId;
    const isSystemUser = userId && !externalName && !externalKonamiId;

    if (!isExternalPlayer && !isSystemUser) {
      return NextResponse.json(
        { error: 'Debe proporcionar userId (usuario del sistema) o externalName y externalKonamiId (jugador externo)' },
        { status: 400 }
      );
    }

    // Verificar que el torneo existe y está en registro
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: { select: { Participants: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'READY') {
      return NextResponse.json(
        { error: 'Solo se pueden agregar jugadores durante el registro' },
        { status: 400 }
      );
    }

    // Verificar capacidad máxima
    if (tournament.maxPlayers && tournament._count.Participants >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: 'El torneo ha alcanzado la capacidad máxima' },
        { status: 400 }
      );
    }

    // Obtener el siguiente seed
    const maxSeed = await prisma.tournamentPlayer.aggregate({
      where: { tournamentId },
      _max: { seed: true },
    });
    const nextSeed = (maxSeed._max.seed || 0) + 1;

    // Caso 1: Jugador externo (no tiene cuenta en el sistema)
    if (isExternalPlayer) {
      // Validar formato del Konami ID (debe ser numérico y de 9-10 dígitos típicamente)
      const konamiIdClean = externalKonamiId.trim();

      // Verificar que no exista ya un jugador con ese Konami ID en el torneo
      const existingExternal = await prisma.tournamentPlayer.findFirst({
        where: {
          tournamentId,
          OR: [
            { externalKonamiId: konamiIdClean },
            { User: { konamiId: konamiIdClean } },
          ],
        },
      });

      if (existingExternal) {
        return NextResponse.json(
          { error: 'Ya existe un jugador con ese Konami ID en el torneo' },
          { status: 400 }
        );
      }

      // También verificar si existe un usuario en el sistema con ese Konami ID
      const existingUser = await prisma.user.findFirst({
        where: { konamiId: konamiIdClean },
        select: { id: true, name: true },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: `Existe un usuario registrado con ese Konami ID: ${existingUser.name}. Agrégalo como usuario del sistema.` },
          { status: 400 }
        );
      }

      // Crear jugador externo
      const player = await prisma.tournamentPlayer.create({
        data: {
          id: randomUUID(),
          tournamentId,
          externalName: externalName.trim(),
          externalKonamiId: konamiIdClean,
          seed: nextSeed,
        },
      });

      return NextResponse.json({
        message: 'Jugador externo agregado correctamente',
        player: {
          ...player,
          User: null,
          Deck: null,
          displayName: externalName.trim(),
          displayKonamiId: konamiIdClean,
          isExternal: true,
        },
      }, { status: 201 });
    }

    // Caso 2: Usuario del sistema
    // Verificar que el usuario existe y tiene Konami ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, konamiId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (!user.konamiId) {
      return NextResponse.json(
        { error: 'El usuario no tiene Konami ID registrado' },
        { status: 400 }
      );
    }

    // Verificar que el jugador no esté ya registrado (por userId o por konamiId)
    const existingPlayer = await prisma.tournamentPlayer.findFirst({
      where: {
        tournamentId,
        OR: [
          { userId },
          { externalKonamiId: user.konamiId },
        ],
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'El jugador ya está registrado en este torneo' },
        { status: 400 }
      );
    }

    // Si se proporciona deckId, verificar que existe y pertenece al usuario
    if (deckId) {
      const deck = await prisma.deck.findFirst({
        where: {
          id: deckId,
          userId,
          isActive: true,
        },
      });

      if (!deck) {
        return NextResponse.json(
          { error: 'Mazo no encontrado o no pertenece al usuario' },
          { status: 400 }
        );
      }

      // Verificar formato si el torneo tiene uno específico
      if (tournament.format && deck.format !== tournament.format) {
        return NextResponse.json(
          { error: `El mazo debe ser del formato ${tournament.format}` },
          { status: 400 }
        );
      }
    }

    // Crear el jugador vinculado al usuario
    const player = await prisma.tournamentPlayer.create({
      data: {
        id: randomUUID(),
        tournamentId,
        userId,
        deckId: deckId || null,
        seed: nextSeed,
      },
      include: {
        User: {
          select: { id: true, name: true, email: true, konamiId: true },
        },
        Deck: {
          select: { id: true, name: true, format: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Jugador agregado correctamente',
      player: {
        ...player,
        displayName: player.User?.name,
        displayKonamiId: player.User?.konamiId,
        isExternal: false,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding player:', error);
    return NextResponse.json(
      { error: 'Error al agregar jugador' },
      { status: 500 }
    );
  }
}
