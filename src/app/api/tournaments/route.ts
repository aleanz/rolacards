import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { calculateSwissRounds } from '@/lib/swiss-tournament';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - Listar torneos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const whereClause: Record<string, unknown> = {};

    if (status) {
      whereClause.status = status;
    }

    const tournaments = await prisma.tournament.findMany({
      where: whereClause,
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
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Error al obtener torneos' },
      { status: 500 }
    );
  }
}

// POST - Crear torneo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

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
      tier = 'TIER_1',
      roundTimeMinutes = 50,
      eventId, // Opcional: vincular a un evento existente
    } = body;

    // Validaciones
    if (!name || !date) {
      return NextResponse.json(
        { error: 'Nombre y fecha son requeridos' },
        { status: 400 }
      );
    }

    // Generar slug único
    let slug = generateSlug(name);
    const existingSlug = await prisma.tournament.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const tournament = await prisma.tournament.create({
      data: {
        id: randomUUID(),
        name,
        slug,
        description: description || null,
        format: format || null,
        date: new Date(date),
        location: location || null,
        entryFee: entryFee ? parseFloat(entryFee) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
        prizeInfo: prizeInfo || null,
        imageUrl: imageUrl || null,
        tier,
        roundTimeMinutes: roundTimeMinutes ? parseInt(roundTimeMinutes) : 50,
        status: 'REGISTRATION',
        currentRound: 0,
        totalRounds: 0,
        creatorId: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        Creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Si hay un eventId, importar participantes aprobados
    if (eventId) {
      const approvedRegistrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: 'APROBADO',
        },
        include: {
          User: true,
        },
      });

      if (approvedRegistrations.length > 0) {
        await prisma.tournamentPlayer.createMany({
          data: approvedRegistrations.map((reg, index) => ({
            id: randomUUID(),
            tournamentId: tournament.id,
            userId: reg.userId,
            deckId: reg.deckId,
            registrationId: reg.id,
            seed: index + 1,
          })),
        });
      }
    }

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Error al crear torneo' },
      { status: 500 }
    );
  }
}
