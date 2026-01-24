import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    console.log('[Orders API] Request body:', JSON.stringify(body, null, 2));
    const { productId, quantity, paymentProofUrl } = body;

    if (!productId || !quantity || !paymentProofUrl) {
      console.log('[Orders API] Missing fields:', { productId, quantity, paymentProofUrl });
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Obtener el producto
    console.log('[Orders API] Fetching product with ID:', productId);
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    console.log('[Orders API] Product found:', product ? 'YES' : 'NO');

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (!product.active) {
      return NextResponse.json({ error: 'Producto no disponible' }, { status: 400 });
    }

    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Stock insuficiente' },
        { status: 400 }
      );
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Calcular total
    const unitPrice = product.price;
    const totalAmount = parseFloat(unitPrice.toString()) * quantity;

    // Crear la orden
    const order = await prisma.order.create({
      data: {
        id: nanoid(),
        userId: user.id,
        productId: product.id,
        quantity,
        unitPrice: new Prisma.Decimal(unitPrice.toString()),
        total: new Prisma.Decimal(totalAmount.toFixed(2)),
        paymentProofUrl,
        status: 'PENDING',
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: Enviar email de notificación al usuario y al admin

    console.log('[Orders API] Order created successfully:', order.id);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('[Orders API] Error creating order:', error);
    console.error('[Orders API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Error al crear la orden',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Si es admin, puede ver todas las órdenes
    const isAdmin = user.role === 'ADMIN';

    const where: any = isAdmin ? {} : { userId: user.id };

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        ApprovedByUser: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Obtener información de productos para cada orden
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const product = await prisma.product.findUnique({
          where: { id: order.productId },
          select: {
            name: true,
            imageUrl: true,
            sku: true,
          },
        });

        return {
          ...order,
          product,
        };
      })
    );

    return NextResponse.json(ordersWithProducts);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener las órdenes' },
      { status: 500 }
    );
  }
}
