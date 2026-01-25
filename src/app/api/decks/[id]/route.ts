import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { validateDeck } from '@/lib/deck-validation';
import { canDeleteDeck } from '@/lib/registration-validation';
import { randomUUID } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/decks/[id] - Get specific deck
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const deck = await prisma.deck.findUnique({
      where: { id: params.id },
      include: {
        DeckCard: {
          orderBy: {
            deckType: 'asc',
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json(
        { error: 'Mazo no encontrado' },
        { status: 404 }
      );
    }

    // Check permissions: owner or admin/staff can view
    const isOwner = deck.userId === session.user.id;
    const isAdminOrStaff = session.user.role === 'ADMIN' || session.user.role === 'STAFF';

    if (!isOwner && !isAdminOrStaff) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver este mazo' },
        { status: 403 }
      );
    }

    // Transform response to match frontend expected structure
    const transformedDeck = {
      ...deck,
      cards: deck.DeckCard || [],
      user: deck.User,
    };

    return NextResponse.json({ deck: transformedDeck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    return NextResponse.json(
      { error: 'Error al obtener mazo' },
      { status: 500 }
    );
  }
}

// PUT /api/decks/[id] - Update deck
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const deck = await prisma.deck.findUnique({
      where: { id: params.id },
    });

    if (!deck) {
      return NextResponse.json(
        { error: 'Mazo no encontrado' },
        { status: 404 }
      );
    }

    // Only owner can update
    if (deck.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este mazo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, format, cards } = body;

    // Validate deck structure if cards are provided
    if (cards) {
      const validation = validateDeck({
        name: name || deck.name,
        description,
        format,
        cards,
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

      // Delete existing cards and create new ones
      await prisma.deckCard.deleteMany({
        where: { deckId: params.id },
      });

      await prisma.deckCard.createMany({
        data: cards.map((card: any) => ({
          id: randomUUID(),
          deckId: params.id,
          cardId: card.cardId,
          quantity: card.quantity,
          deckType: card.deckType,
          cardData: card.cardData,
        })),
      });
    }

    // Update deck metadata
    const updatedDeck = await prisma.deck.update({
      where: { id: params.id },
      data: {
        name: name || deck.name,
        description,
        format,
        updatedAt: new Date(),
      },
      include: {
        DeckCard: true,
      },
    });

    return NextResponse.json({
      message: 'Mazo actualizado exitosamente',
      deck: updatedDeck,
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mazo' },
      { status: 500 }
    );
  }
}

// DELETE /api/decks/[id] - Delete deck
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if deck can be deleted
    const canDelete = await canDeleteDeck(params.id, session.user.id);

    if (!canDelete.canDelete) {
      return NextResponse.json(
        { error: canDelete.reason || 'No se puede eliminar este mazo' },
        { status: 400 }
      );
    }

    // Delete deck (cards will be deleted automatically due to cascade)
    await prisma.deck.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Mazo eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Error al eliminar mazo' },
      { status: 500 }
    );
  }
}
