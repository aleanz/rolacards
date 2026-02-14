import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { verifyMobileToken } from '@/lib/mobile-auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/events - Listar eventos
export async function GET(request: NextRequest) {
  try {
    console.log('[API /api/events] Starting request');
    console.log('[API /api/events] URL:', request.url);

    // Verificar sesión web o token móvil
    const session = await getServerSession(authOptions);
    const mobileUser = !session ? await verifyMobileToken(request) : null;

    const userId = session?.user?.id || mobileUser?.id;
    const isAdmin = session?.user?.role === 'ADMIN' || mobileUser?.role === 'ADMIN';

    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const featured = searchParams.get('featured');
    const upcoming = searchParams.get('upcoming');

    console.log('[API /api/events] Filters:', { published, featured, upcoming });

    const where: any = {};

    // Filtrar por publicados
    if (published === 'true') {
      where.published = true;
    }

    // Filtrar por destacados
    if (featured === 'true') {
      where.featured = true;
    }

    // Filtrar eventos próximos (fecha mayor o igual al inicio de hoy en hora de México)
    if (upcoming === 'true') {
      // Obtener la fecha actual en zona horaria de México
      const mexicoNow = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
      // mexicoNow es "YYYY-MM-DD", crear fecha al inicio de ese día en UTC
      const todayStart = new Date(mexicoNow + 'T00:00:00.000Z');
      where.date = {
        gte: todayStart,
      };
    }

    console.log('[API /api/events] Where clause:', JSON.stringify(where));
    console.log('[API /api/events] Querying database...');

    const events = await prisma.event.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        EventRegistration: isAdmin ? {
          // Si es admin, traer todas las inscripciones aprobadas con info completa
          where: {
            status: {
              in: ['APROBADO', 'PENDIENTE'],
            },
          },
          select: {
            id: true,
            status: true,
            User: {
              select: {
                id: true,
                name: true,
                email: true,
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
        } : userId ? {
          // Si es usuario regular, solo traer su inscripción
          where: {
            userId: userId,
          },
          select: {
            id: true,
            status: true,
          },
        } : false,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Transformar datos para incluir el estado de inscripción
    const eventsWithRegistration = events.map(event => {
      if (isAdmin) {
        // Para admins, enviar todas las inscripciones
        return event;
      } else {
        // Para usuarios regulares, solo el estado de su inscripción
        const userRegistration = userId && event.EventRegistration && event.EventRegistration.length > 0
          ? event.EventRegistration[0]
          : null;

        return {
          ...event,
          userRegistrationStatus: userRegistration?.status || null,
          EventRegistration: undefined, // No enviar las inscripciones completas al cliente
        };
      }
    });

    console.log('[API /api/events] Found events:', events.length);
    console.log('[API /api/events] Success, returning events');

    return NextResponse.json(eventsWithRegistration);
  } catch (error) {
    console.error('[API /api/events] ERROR:', error);
    console.error('[API /api/events] Error name:', error instanceof Error ? error.name : 'unknown');
    console.error('[API /api/events] Error message:', error instanceof Error ? error.message : 'unknown');
    console.error('[API /api/events] Error stack:', error instanceof Error ? error.stack : 'unknown');
    return NextResponse.json({
      error: 'Error al obtener eventos',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST /api/events - Crear evento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      date,
      endDate,
      location,
      type,
      format,
      genesysPointsLimit,
      entryFee,
      maxPlayers,
      prizeInfo,
      imageUrl,
      published,
      featured,
    } = body;

    // Validaciones
    if (!title || !date || !type) {
      return NextResponse.json(
        { error: 'Título, fecha y tipo son requeridos' },
        { status: 400 }
      );
    }

    // Generar slug único
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (await prisma.event.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Crear evento
    const event = await prisma.event.create({
      data: {
        id: randomUUID(),
        title,
        slug,
        description,
        content,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        type,
        format,
        genesysPointsLimit: genesysPointsLimit ? parseInt(genesysPointsLimit) : null,
        entryFee: entryFee ? new Prisma.Decimal(entryFee) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
        prizeInfo,
        imageUrl,
        published: published || false,
        featured: featured || false,
        updatedAt: new Date(),
        creatorId: session.user.id,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('[API /api/events POST] Error creating event:', error);
    console.error('[API /api/events POST] Error details:', error instanceof Error ? error.message : 'Unknown');
    console.error('[API /api/events POST] Error stack:', error instanceof Error ? error.stack : 'Unknown');
    return NextResponse.json({
      error: 'Error al crear evento',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
