import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/events - Listar eventos
export async function GET(request: NextRequest) {
  try {
    console.log('[API /api/events] Starting request');
    console.log('[API /api/events] URL:', request.url);

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

    // Filtrar eventos próximos (fecha mayor o igual a hoy)
    if (upcoming === 'true') {
      where.date = {
        gte: new Date(),
      };
    }

    console.log('[API /api/events] Where clause:', JSON.stringify(where));
    console.log('[API /api/events] Querying database...');

    const events = await prisma.event.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    console.log('[API /api/events] Found events:', events.length);
    console.log('[API /api/events] Success, returning events');

    return NextResponse.json(events);
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
        title,
        slug,
        description,
        content,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        type,
        format,
        entryFee: entryFee ? parseFloat(entryFee) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
        prizeInfo,
        imageUrl,
        published: published || false,
        featured: featured || false,
        creatorId: session.user.id,
      },
      include: {
        creator: {
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
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Error al crear evento' }, { status: 500 });
  }
}
