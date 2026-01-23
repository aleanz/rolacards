import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSaleReceipt } from '@/lib/pdf-generator';

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
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        SaleItem: {
          include: {
            Product: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    // Obtener configuración de la tienda
    const settings = await prisma.storeSetting.findMany({
      where: {
        key: {
          in: [
            'store_name',
            'store_address',
            'store_city',
            'store_state',
            'store_phone',
            'store_email',
          ],
        },
      },
    });

    const storeInfo = settings.reduce((acc: any, setting) => {
      acc[setting.key.replace('store_', '')] = setting.value;
      return acc;
    }, {});

    // Transform sale data to match expected format
    const saleData = {
      ...sale,
      user: sale.User,
      items: sale.SaleItem,
    };

    // Generar PDF
    const pdfBuffer = await generateSaleReceipt(saleData as any, storeInfo);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="comprobante-${sale.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
