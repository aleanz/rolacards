import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - Obtener torneo por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
        Participants: {
          include: {
            User: {
              select: { id: true, name: true, email: true, konamiId: true },
            },
            Deck: {
              select: { id: true, name: true, format: true },
            },
          },
          orderBy: [
            { matchPoints: 'desc' },
            { opponentMatchWinPct: 'desc' },
          ],
        },
        Matches: {
          include: {
            Player1: {
              include: {
                User: { select: { id: true, name: true } },
              },
            },
            Player2: {
              include: {
                User: { select: { id: true, name: true } },
              },
            },
            Winner: {
              include: {
                User: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [
            { round: 'asc' },
            { table: 'asc' },
          ],
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Error al obtener torneo' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar torneo
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      format,
      date,
      location,
      entryFee,
      maxPlayers,
      prizeInfo,
      imageUrl,
      tier,
      roundTimeMinutes,
      status,
    } = body;

    const existingTournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!existingTournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    // Generar nuevo slug si cambia el nombre
    let slug = existingTournament.slug;
    if (name && name !== existingTournament.name) {
      slug = generateSlug(name);
      const existingSlug = await prisma.tournament.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(name && { slug }),
        ...(description !== undefined && { description }),
        ...(format !== undefined && { format }),
        ...(date && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(entryFee !== undefined && { entryFee: entryFee ? parseFloat(entryFee) : null }),
        ...(maxPlayers !== undefined && { maxPlayers: maxPlayers ? parseInt(maxPlayers) : null }),
        ...(prizeInfo !== undefined && { prizeInfo }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(tier && { tier }),
        ...(roundTimeMinutes !== undefined && { roundTimeMinutes: parseInt(roundTimeMinutes) }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            Participants: true,
            Matches: true,
          },
        },
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Error al actualizar torneo' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar torneo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: {
          select: { Matches: true },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Torneo no encontrado' },
        { status: 404 }
      );
    }

    // No permitir eliminar torneos en progreso
    if (tournament.status === 'IN_PROGRESS' || tournament.status === 'TOP_CUT') {
      return NextResponse.json(
        { error: 'No se puede eliminar un torneo en progreso' },
        { status: 400 }
      );
    }

    // Eliminar en cascada (matches y players se eliminan por onDelete: Cascade)
    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Torneo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Error al eliminar torneo' },
      { status: 500 }
    );
  }
}
