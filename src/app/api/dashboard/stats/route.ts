import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener fecha del inicio del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Ventas del mes actual
    const currentMonthSales = await prisma.sale.aggregate({
      where: {
        date: {
          gte: startOfMonth,
        },
        status: 'COMPLETED',
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    // Ventas del mes anterior
    const lastMonthSales = await prisma.sale.aggregate({
      where: {
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: 'COMPLETED',
      },
      _sum: {
        total: true,
      },
    });

    // Calcular cambio porcentual de ventas
    const currentTotal = parseFloat(currentMonthSales._sum.total?.toString() || '0');
    const lastTotal = parseFloat(lastMonthSales._sum.total?.toString() || '0');
    const salesChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    // Productos en stock
    const productsInStock = await prisma.product.aggregate({
      where: {
        active: true,
      },
      _sum: {
        stock: true,
      },
      _count: true,
    });

    // Productos en stock del mes anterior (aproximado)
    const lastMonthProducts = await prisma.product.count({
      where: {
        active: true,
        createdAt: {
          lte: endOfLastMonth,
        },
      },
    });

    const currentProductCount = productsInStock._count;
    const stockChange = lastMonthProducts > 0
      ? ((currentProductCount - lastMonthProducts) / lastMonthProducts) * 100
      : 0;

    // Usuarios totales (STAFF y ADMIN que no son el sistema)
    const activeUsers = await prisma.user.count({
      where: {
        role: {
          in: ['ADMIN', 'STAFF'],
        },
      },
    });

    // Usuarios creados este mes
    const usersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Usuarios creados el mes anterior
    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const usersChange = usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : (usersThisMonth > 0 ? 100 : 0);

    // Eventos este mes
    const eventsThisMonth = await prisma.event.count({
      where: {
        date: {
          gte: startOfMonth,
        },
      },
    });

    // Eventos el mes anterior
    const eventsLastMonth = await prisma.event.count({
      where: {
        date: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const eventsChange = eventsThisMonth - eventsLastMonth;

    // Actividad reciente
    const recentActivity = [];

    // Última venta
    const lastSale = await prisma.sale.findFirst({
      orderBy: { date: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
          take: 1,
        },
      },
    });

    if (lastSale) {
      const productName = lastSale.items[0]?.product.cardName || lastSale.items[0]?.product.name;
      const minutesAgo = Math.floor((now.getTime() - new Date(lastSale.date).getTime()) / 60000);
      recentActivity.push({
        action: 'Nueva venta',
        detail: `Producto: ${productName}`,
        time: minutesAgo < 60 ? `Hace ${minutesAgo} min` : `Hace ${Math.floor(minutesAgo / 60)} hora${Math.floor(minutesAgo / 60) > 1 ? 's' : ''}`,
      });
    }

    // Último usuario registrado
    const lastUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (lastUser) {
      const minutesAgo = Math.floor((now.getTime() - new Date(lastUser.createdAt).getTime()) / 60000);
      recentActivity.push({
        action: 'Usuario registrado',
        detail: lastUser.email,
        time: minutesAgo < 60 ? `Hace ${minutesAgo} min` : `Hace ${Math.floor(minutesAgo / 60)} hora${Math.floor(minutesAgo / 60) > 1 ? 's' : ''}`,
      });
    }

    // Último evento creado
    const lastEvent = await prisma.event.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (lastEvent) {
      const minutesAgo = Math.floor((now.getTime() - new Date(lastEvent.createdAt).getTime()) / 60000);
      recentActivity.push({
        action: 'Evento creado',
        detail: lastEvent.title,
        time: minutesAgo < 60 ? `Hace ${minutesAgo} min` : `Hace ${Math.floor(minutesAgo / 60)} hora${Math.floor(minutesAgo / 60) > 1 ? 's' : ''}`,
      });
    }

    // Última actualización de inventario
    const lastProduct = await prisma.product.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (lastProduct) {
      const minutesAgo = Math.floor((now.getTime() - new Date(lastProduct.updatedAt).getTime()) / 60000);
      recentActivity.push({
        action: 'Inventario actualizado',
        detail: `${lastProduct.cardName || lastProduct.name}`,
        time: minutesAgo < 60 ? `Hace ${minutesAgo} min` : `Hace ${Math.floor(minutesAgo / 60)} hora${Math.floor(minutesAgo / 60) > 1 ? 's' : ''}`,
      });
    }

    return NextResponse.json({
      stats: {
        sales: {
          value: currentTotal,
          change: salesChange,
        },
        products: {
          value: currentProductCount,
          totalStock: productsInStock._sum.stock || 0,
          change: stockChange,
        },
        users: {
          value: activeUsers,
          change: usersChange,
        },
        events: {
          value: eventsThisMonth,
          change: eventsChange,
        },
      },
      recentActivity: recentActivity.slice(0, 4),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
