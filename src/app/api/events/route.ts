import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/events - Listar eventos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const featured = searchParams.get('featured');
    const upcoming = searchParams.get('upcoming');

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

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
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
