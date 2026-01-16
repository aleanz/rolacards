import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateDeck } from '@/lib/deck-validation';

// POST /api/decks/[id]/validate - Validate deck without saving
export async function POST(
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

    const body = await request.json();
    const { name, description, format, cards } = body;

    // Validate deck structure
    const validation = validateDeck({
      id: params.id,
      name,
      description,
      format,
      cards: cards || [],
    });

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error('Error validating deck:', error);
    return NextResponse.json(
      { error: 'Error al validar mazo' },
      { status: 500 }
    );
  }
}
