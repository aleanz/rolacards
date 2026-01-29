import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

// GET /api/sponsors - Listar sponsors activos (público)
export async function GET() {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(sponsors);
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json({ error: 'Error al obtener sponsors' }, { status: 500 });
  }
}

// POST /api/sponsors - Crear sponsor (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name, logoUrl, linkUrl, order, active } = body;

    if (!name || !logoUrl || !linkUrl) {
      return NextResponse.json({ error: 'Nombre, logo y enlace son requeridos' }, { status: 400 });
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        id: randomUUID(),
        name,
        logoUrl,
        linkUrl,
        order: order ?? 0,
        active: active ?? true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json({ error: 'Error al crear sponsor' }, { status: 500 });
  }
}
