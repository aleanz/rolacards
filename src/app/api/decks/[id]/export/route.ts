import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/decks/[id]/export - Export deck to YDK format (EDOPro/YGOPro compatible)
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

    // Check permissions: owner or admin/staff can export
    const isOwner = deck.userId === session.user.id;
    const isAdminOrStaff = session.user.role === 'ADMIN' || session.user.role === 'STAFF';

    if (!isOwner && !isAdminOrStaff) {
      return NextResponse.json(
        { error: 'No tienes permiso para exportar este mazo' },
        { status: 403 }
      );
    }

    // Separate cards by deck type
    const mainDeck: number[] = [];
    const extraDeck: number[] = [];
    const sideDeck: number[] = [];

    for (const card of deck.DeckCard) {
      // Add card ID for each copy (quantity)
      for (let i = 0; i < card.quantity; i++) {
        switch (card.deckType) {
          case 'MAIN':
            mainDeck.push(card.cardId);
            break;
          case 'EXTRA':
            extraDeck.push(card.cardId);
            break;
          case 'SIDE':
            sideDeck.push(card.cardId);
            break;
        }
      }
    }

    // Build YDK file content
    const ydkLines: string[] = [];

    // Header
    ydkLines.push(`#created by rola-cards - ${deck.User?.name || 'Unknown'}`);

    // Main deck
    ydkLines.push('#main');
    mainDeck.forEach(cardId => ydkLines.push(cardId.toString()));

    // Extra deck
    ydkLines.push('#extra');
    extraDeck.forEach(cardId => ydkLines.push(cardId.toString()));

    // Side deck
    ydkLines.push('!side');
    sideDeck.forEach(cardId => ydkLines.push(cardId.toString()));

    const ydkContent = ydkLines.join('\n');

    // Sanitize filename (remove special characters)
    const sanitizedName = deck.name
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-_]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);

    // Return as downloadable file
    return new NextResponse(ydkContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ydk',
        'Content-Disposition': `attachment; filename="${sanitizedName}.ydk"`,
      },
    });
  } catch (error) {
    console.error('Error exporting deck:', error);
    return NextResponse.json(
      { error: 'Error al exportar mazo' },
      { status: 500 }
    );
  }
}
