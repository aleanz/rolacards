import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/events/[id]/registrations - Obtener inscripciones de un evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        endDate: true,
        location: true,
        type: true,
        format: true,
        entryFee: true,
        maxPlayers: true,
        imageUrl: true,
        published: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: params.id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            konamiId: true,
          },
        },
        Deck: {
          select: {
            id: true,
            name: true,
            format: true,
            DeckCard: {
              select: {
                id: true,
                cardId: true,
                quantity: true,
                deckType: true,
                cardData: true,
              },
              orderBy: {
                cardId: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ event, registrations });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return NextResponse.json(
      { error: 'Error al obtener las inscripciones del evento' },
      { status: 500 }
    );
  }
}
