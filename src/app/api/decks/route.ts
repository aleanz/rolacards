import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { validateDeck } from '@/lib/deck-validation';
import { randomUUID } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/decks - List user's decks (or all decks for admin with ?userId=xxx)
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
    const userIdParam = searchParams.get('userId');

    // Determine which user's decks to fetch
    let userId = session.user.id;

    // Admin can view other users' decks
    if (userIdParam && (session.user.role === 'ADMIN' || session.user.role === 'STAFF')) {
      userId = userIdParam;
    }

    const decks = await prisma.deck.findMany({
      where: {
        userId,
      },
      include: {
        DeckCard: {
          orderBy: {
            deckType: 'asc',
          },
        },
        _count: {
          select: {
            DeckCard: true,
            EventRegistration: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ decks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json(
      { error: 'Error al obtener mazos' },
      { status: 500 }
    );
  }
}

// POST /api/decks - Create new deck
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
    const { name, description, format, cards } = body;

    // Validate deck structure
    const validation = validateDeck({
      name,
      description,
      format,
      cards: cards || [],
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'El mazo tiene errores de validación',
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Create deck with cards
    const deck = await prisma.deck.create({
      data: {
        id: randomUUID(),
        name,
        description,
        format,
        userId: session.user.id,
        updatedAt: new Date(),
        DeckCard: {
          create: cards.map((card: any) => ({
            id: randomUUID(),
            cardId: card.cardId,
            quantity: card.quantity,
            deckType: card.deckType,
            cardData: card.cardData,
          })),
        },
      },
      include: {
        DeckCard: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Mazo creado exitosamente',
        deck,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Error al crear mazo' },
      { status: 500 }
    );
  }
}
