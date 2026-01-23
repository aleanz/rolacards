import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const registrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Event: {
          select: {
            id: true,
            title: true,
            date: true,
            format: true,
            entryFee: true,
            maxPlayers: true,
          },
        },
        Deck: {
          select: {
            id: true,
            name: true,
            format: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Para cada registro, obtener el count de aprobados del evento
    const registrationsWithCounts = await Promise.all(
      registrations.map(async (reg) => {
        const approvedCount = await prisma.eventRegistration.count({
          where: {
            eventId: reg.Event.id,
            status: 'APROBADO',
          },
        });

        return {
          ...reg,
          Event: {
            ...reg.Event,
            approvedCount,
          },
        };
      })
    );

    return NextResponse.json({ registrations: registrationsWithCounts });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes' },
      { status: 500 }
    );
  }
}
