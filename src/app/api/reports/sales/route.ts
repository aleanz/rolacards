import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filterType') || 'month'; // 'month' or 'year'
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let startDate: Date;
    let endDate: Date;

    if (filterType === 'month' && month && year) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, monthNum - 1, 1);
      endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);
    } else if (filterType === 'year' && year) {
      const yearNum = parseInt(year);
      startDate = new Date(yearNum, 0, 1);
      endDate = new Date(yearNum, 11, 31, 23, 59, 59);
    } else {
      // Default: current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Obtener ventas con items y productos
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
                cardName: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calcular totales y estadísticas
    const totalSales = sales.filter((s) => s.status === 'COMPLETED').length;
    const totalRevenue = sales
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, sale) => sum + parseFloat(sale.total.toString()), 0);

    const totalDiscounts = sales
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, sale) => sum + parseFloat(sale.discount.toString()), 0);

    const totalItemsSold = sales
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, sale) => {
        return (
          sum +
          sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
        );
      }, 0);

    // Agrupar por método de pago
    const paymentMethodBreakdown = sales
      .filter((s) => s.status === 'COMPLETED')
      .reduce((acc: any, sale) => {
        const method = sale.paymentMethod;
        if (!acc[method]) {
          acc[method] = { count: 0, total: 0 };
        }
        acc[method].count++;
        acc[method].total += parseFloat(sale.total.toString());
        return acc;
      }, {});

    // Top productos vendidos
    const productSales: any = {};
    sales
      .filter((s) => s.status === 'COMPLETED')
      .forEach((sale) => {
        sale.items.forEach((item) => {
          const productName = item.product.cardName || item.product.name;
          if (!productSales[productName]) {
            productSales[productName] = {
              name: productName,
              sku: item.product.sku,
              type: item.product.type,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += parseFloat(item.total.toString());
        });
      });

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    // Ventas por día
    const salesByDay: any = {};
    sales
      .filter((s) => s.status === 'COMPLETED')
      .forEach((sale) => {
        const day = new Date(sale.date).toISOString().split('T')[0];
        if (!salesByDay[day]) {
          salesByDay[day] = { count: 0, total: 0 };
        }
        salesByDay[day].count++;
        salesByDay[day].total += parseFloat(sale.total.toString());
      });

    // Formatear datos para la tabla
    const salesData = sales.map((sale) => ({
      id: sale.id,
      number: sale.number,
      date: sale.date,
      customerName: sale.customerName || 'Sin nombre',
      customerEmail: sale.customerEmail || '',
      customerPhone: sale.customerPhone || '',
      user: sale.user.name,
      userEmail: sale.user.email,
      itemsCount: sale.items.length,
      totalItems: sale.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(sale.subtotal.toString()),
      discount: parseFloat(sale.discount.toString()),
      total: parseFloat(sale.total.toString()),
      paymentMethod: sale.paymentMethod,
      status: sale.status,
      notes: sale.notes || '',
      items: sale.items.map((item) => ({
        productName: item.product.cardName || item.product.name,
        sku: item.product.sku,
        type: item.product.type,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice.toString()),
        discount: parseFloat(item.discount.toString()),
        total: parseFloat(item.total.toString()),
      })),
    }));

    return NextResponse.json({
      summary: {
        totalSales,
        totalRevenue,
        totalDiscounts,
        totalItemsSold,
        averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
        period: {
          start: startDate,
          end: endDate,
        },
      },
      paymentMethodBreakdown,
      topProducts,
      salesByDay,
      sales: salesData,
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    return NextResponse.json(
      { error: 'Error al obtener reporte de ventas' },
      { status: 500 }
    );
  }
}
