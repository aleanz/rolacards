import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status) {
      where.status = status;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        SaleItem: {
          include: {
            Product: {
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
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      items,
      paymentMethod,
      discount = 0,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
    }

    // Verificar stock disponible para todos los productos
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name || product.cardName}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    // Calcular totales
    let subtotal = 0;
    const processedItems: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: any;
      discount: number;
      total: number;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      const itemDiscount = item.discount || 0;
      const itemTotal = (product!.price.toNumber() * item.quantity) - itemDiscount;
      subtotal += itemTotal;

      processedItems.push({
        id: randomUUID(),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product!.price,
        discount: itemDiscount,
        total: itemTotal,
      });
    }

    const tax = 0; // Puedes calcular IVA aquí si es necesario
    const total = subtotal - discount + tax;

    // Crear venta y actualizar stock en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          customerName,
          customerEmail,
          customerPhone,
          notes,
          SaleItem: {
            create: processedItems,
          },
        },
        include: {
          SaleItem: {
            include: {
              Product: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Actualizar stock y crear historial
      for (const item of processedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const newStock = product!.stock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        await tx.stockHistory.create({
          data: {
            id: randomUUID(),
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            previousStock: product!.stock,
            newStock,
            note: `Venta #${newSale.number}`,
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
