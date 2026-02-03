import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE - Eliminar jugador del torneo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tournamentId, playerId } = await params;

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el torneo existe y está en registro
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'READY') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar jugadores antes de iniciar el torneo' },
        { status: 400 }
      );
    }

    // Verificar que el jugador existe
    const player = await prisma.tournamentPlayer.findFirst({
      where: {
        id: playerId,
        tournamentId,
      },
      include: {
        User: { select: { name: true } },
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado en este torneo' },
        { status: 404 }
      );
    }

    const playerName = player.User?.name || player.externalName || 'Jugador';

    // Eliminar el jugador
    await prisma.tournamentPlayer.delete({
      where: { id: playerId },
    });

    // Reordenar seeds de los jugadores restantes
    const remainingPlayers = await prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      orderBy: { seed: 'asc' },
    });

    for (let i = 0; i < remainingPlayers.length; i++) {
      await prisma.tournamentPlayer.update({
        where: { id: remainingPlayers[i].id },
        data: { seed: i + 1 },
      });
    }

    return NextResponse.json({
      message: `${playerName} eliminado del torneo`,
    });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Error al eliminar jugador' },
      { status: 500 }
    );
  }
}

// PATCH - Editar jugador del torneo (solo jugadores externos)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; playerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: tournamentId, playerId } = await params;

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { externalName, externalKonamiId } = body;

    // Verificar que el torneo existe y está en registro
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'REGISTRATION' && tournament.status !== 'READY') {
      return NextResponse.json(
        { error: 'Solo se pueden editar jugadores antes de iniciar el torneo' },
        { status: 400 }
      );
    }

    // Verificar que el jugador existe
    const player = await prisma.tournamentPlayer.findFirst({
      where: {
        id: playerId,
        tournamentId,
      },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Jugador no encontrado en este torneo' },
        { status: 404 }
      );
    }

    // Solo permitir editar jugadores externos
    if (player.userId) {
      return NextResponse.json(
        { error: 'Solo se pueden editar los datos de jugadores externos' },
        { status: 400 }
      );
    }

    // Validar datos
    if (!externalName?.trim() || !externalKonamiId?.trim()) {
      return NextResponse.json(
        { error: 'Nombre y Konami ID son requeridos' },
        { status: 400 }
      );
    }

    const konamiIdClean = externalKonamiId.trim();

    // Verificar que no exista otro jugador con ese Konami ID en el torneo
    const existingWithKonamiId = await prisma.tournamentPlayer.findFirst({
      where: {
        tournamentId,
        id: { not: playerId },
        OR: [
          { externalKonamiId: konamiIdClean },
          { User: { konamiId: konamiIdClean } },
        ],
      },
    });

    if (existingWithKonamiId) {
      return NextResponse.json(
        { error: 'Ya existe otro jugador con ese Konami ID en el torneo' },
        { status: 400 }
      );
    }

    // Verificar si existe un usuario en el sistema con ese Konami ID
    const existingUser = await prisma.user.findFirst({
      where: { konamiId: konamiIdClean },
      select: { id: true, name: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Existe un usuario registrado con ese Konami ID: ${existingUser.name}. Elimina este jugador y agrégalo como usuario del sistema.` },
        { status: 400 }
      );
    }

    // Actualizar el jugador
    const updatedPlayer = await prisma.tournamentPlayer.update({
      where: { id: playerId },
      data: {
        externalName: externalName.trim(),
        externalKonamiId: konamiIdClean,
      },
    });

    return NextResponse.json({
      message: 'Jugador actualizado correctamente',
      player: {
        ...updatedPlayer,
        displayName: externalName.trim(),
        displayKonamiId: konamiIdClean,
        isExternal: true,
      },
    });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Error al actualizar jugador' },
      { status: 500 }
    );
  }
}
