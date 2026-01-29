import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/sponsors/[id] - Obtener sponsor específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    return NextResponse.json({ error: 'Error al obtener sponsor' }, { status: 500 });
  }
}

// PUT /api/sponsors/[id] - Actualizar sponsor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, logoUrl, linkUrl, order, active } = body;

    const existingSponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!existingSponsor) {
      return NextResponse.json({ error: 'Sponsor no encontrado' }, { status: 404 });
    }

    const sponsor = await prisma.sponsor.update({
      where: { id },
      data: {
        name: name ?? existingSponsor.name,
        logoUrl: logoUrl ?? existingSponsor.logoUrl,
        linkUrl: linkUrl ?? existingSponsor.linkUrl,
        order: order ?? existingSponsor.order,
        active: active ?? existingSponsor.active,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return NextResponse.json({ error: 'Error al actualizar sponsor' }, { status: 500 });
  }
}

// DELETE /api/sponsors/[id] - Eliminar sponsor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const existingSponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!existingSponsor) {
      return NextResponse.json({ error: 'Sponsor no encontrado' }, { status: 404 });
    }

    await prisma.sponsor.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sponsor eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return NextResponse.json({ error: 'Error al eliminar sponsor' }, { status: 500 });
  }
}
