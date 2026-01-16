import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/registrations/event/[eventId] - Get all registrations for a specific event (Admin/Staff only)
export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Only Admin and Staff can view event registrations
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'No tienes permiso para ver inscripciones' },
        { status: 403 }
      );
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: params.eventId },
      select: {
        id: true,
        title: true,
        date: true,
        maxPlayers: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Get all registrations for the event with full details
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId: params.eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            konamiId: true,
          },
        },
        deck: {
          include: {
            cards: {
              orderBy: {
                deckType: 'asc',
              },
            },
          },
        },
      },
      orderBy: [
        {
          status: 'asc', // APROBADO, PENDIENTE, RECHAZADO
        },
        {
          createdAt: 'asc', // First come, first served
        },
      ],
    });

    // Calculate statistics
    const stats = {
      total: registrations.length,
      aprobado: registrations.filter(r => r.status === 'APROBADO').length,
      pendiente: registrations.filter(r => r.status === 'PENDIENTE').length,
      rechazado: registrations.filter(r => r.status === 'RECHAZADO').length,
      availableSlots: event.maxPlayers
        ? Math.max(0, event.maxPlayers - registrations.filter(r => r.status === 'APROBADO').length)
        : null,
    };

    return NextResponse.json({
      event,
      registrations,
      stats,
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return NextResponse.json(
      { error: 'Error al obtener inscripciones del evento' },
      { status: 500 }
    );
  }
}
