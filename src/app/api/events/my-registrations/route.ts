import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        Event: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
            format: true,
            entryFee: true,
            location: true,
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

    // Add lowercase aliases for frontend compatibility (perfil page uses lowercase)
    const transformed = registrations.map((reg) => ({
      ...reg,
      event: reg.Event,
      deck: reg.Deck,
    }));

    return NextResponse.json({ registrations: transformed });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return NextResponse.json(
      { error: 'Error al obtener tus inscripciones' },
      { status: 500 }
    );
  }
}
