import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                cardName: true,
                imageUrl: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cancelar venta y devolver stock
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: params.id },
        include: { items: true },
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Devolver stock
      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const newStock = product!.stock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockHistory.create({
          data: {
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            previousStock: product!.stock,
            newStock,
            note: `Cancelación de venta #${sale.number}`,
          },
        });
      }

      // Marcar venta como cancelada
      await tx.sale.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      });
    });

    return NextResponse.json({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    return NextResponse.json({ error: 'Failed to cancel sale' }, { status: 500 });
  }
}
