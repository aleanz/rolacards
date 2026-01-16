import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { validateRegistration, validateKonamiId } from '@/lib/registration-validation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/registrations - List registrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    const isAdminOrStaff = session.user.role === 'ADMIN' || session.user.role === 'STAFF';

    // Build query filters
    const where: any = {};

    // Client can only see their own registrations
    if (!isAdminOrStaff) {
      where.userId = session.user.id;
    }

    // Filter by event if specified
    if (eventId) {
      where.eventId = eventId;
    }

    // Filter by status if specified
    if (status && ['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(status)) {
      where.status = status;
    }

    const registrations = await prisma.eventRegistration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            konamiId: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            date: true,
            location: true,
            imageUrl: true,
          },
        },
        deck: {
          select: {
            id: true,
            name: true,
            format: true,
            _count: {
              select: {
                cards: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Error al obtener inscripciones' },
      { status: 500 }
    );
  }
}

// POST /api/registrations - Create new registration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, deckId, konamiId } = body;

    // Validate required fields
    if (!eventId || !deckId) {
      return NextResponse.json(
        { error: 'Evento y mazo son requeridos' },
        { status: 400 }
      );
    }

    // Validate Konami ID format if provided
    if (konamiId && !validateKonamiId(konamiId)) {
      return NextResponse.json(
        { error: 'Formato de Konami ID inválido (debe ser alfanumérico de 6-12 caracteres)' },
        { status: 400 }
      );
    }

    // Validate registration
    const validation = await validateRegistration(session.user.id, eventId, deckId);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'La inscripción no es válida',
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        userId: session.user.id,
        eventId,
        deckId,
        konamiId,
        status: 'PENDIENTE',
      },
      include: {
        event: {
          select: {
            title: true,
            date: true,
          },
        },
        deck: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Inscripción creada exitosamente',
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Error al crear inscripción' },
      { status: 500 }
    );
  }
}
