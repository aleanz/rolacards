import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const YGOPRODECK_API = 'https://db.ygoprodeck.com/api/v7';

// GET /api/cards/search?name=xxx&num=20
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
    const name = searchParams.get('name');
    const num = searchParams.get('num') || '20';

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un nombre de carta' },
        { status: 400 }
      );
    }

    // Build API URL
    const apiUrl = new URL(`${YGOPRODECK_API}/cardinfo.php`);
    apiUrl.searchParams.append('fname', name); // Fuzzy name search
    apiUrl.searchParams.append('num', num);

    // Fetch from YGOProDeck API
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      if (response.status === 400) {
        return NextResponse.json(
          { cards: [], message: 'No se encontraron cartas' },
          { status: 200 }
        );
      }
      throw new Error('Error fetching cards from YGOProDeck');
    }

    const data = await response.json();

    return NextResponse.json({
      cards: data.data || [],
      total: data.data?.length || 0,
    });
  } catch (error) {
    console.error('Card search error:', error);
    return NextResponse.json(
      { error: 'Error al buscar cartas', cards: [] },
      { status: 500 }
    );
  }
}
