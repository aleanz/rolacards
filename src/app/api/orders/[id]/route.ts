import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, rejectionNote } = body;

    if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    // Obtener la orden
    const order = await prisma.order.findUnique({
      where: { id: params.id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta orden ya ha sido procesada' },
        { status: 400 }
      );
    }

    // Si es aprobación, verificar stock
    if (action === 'APPROVED') {
      const product = await prisma.product.findUnique({
        where: { id: order.productId },
      });

      if (!product) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        );
      }

      if (product.stock < order.quantity) {
        return NextResponse.json(
          { error: 'Stock insuficiente' },
          { status: 400 }
        );
      }

      // Actualizar orden y reducir stock en una transacción
      const [updatedOrder] = await prisma.$transaction([
        prisma.order.update({
          where: { id: params.id },
          data: {
            status: action,
            approvedAt: new Date(),
            approvedBy: user.id,
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
        }),
        prisma.product.update({
          where: { id: order.productId },
          data: {
            stock: {
              decrement: order.quantity,
            },
            updatedAt: new Date(),
          },
        }),
      ]);

      // TODO: Enviar email de aprobación

      return NextResponse.json(updatedOrder);
    } else {
      // Rechazo
      if (!rejectionNote) {
        return NextResponse.json(
          { error: 'Debe proporcionar una nota de rechazo' },
          { status: 400 }
        );
      }

      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: {
          status: action,
          rejectionNote,
          rejectedAt: new Date(),
          approvedBy: user.id,
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

      // TODO: Enviar email de rechazo

      return NextResponse.json(updatedOrder);
    }
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Error al procesar la orden' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
    });

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Solo el dueño o un admin pueden ver la orden
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta orden' },
        { status: 403 }
      );
    }

    // Obtener producto
    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      select: {
        name: true,
        imageUrl: true,
        sku: true,
      },
    });

    return NextResponse.json({
      ...order,
      product,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Error al obtener la orden' },
      { status: 500 }
    );
  }
}
