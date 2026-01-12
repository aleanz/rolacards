import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/inventory - Listar productos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // SINGLE, SEALED (BOX, BOOSTER, etc.)
    const search = searchParams.get('search');
    const active = searchParams.get('active');

    const where: any = {};

    if (type === 'SINGLE') {
      where.type = 'SINGLE';
    } else if (type === 'SEALED') {
      where.type = { in: ['BOOSTER', 'BOX', 'STRUCTURE', 'TIN', 'ACCESSORY', 'OTHER'] };
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (active === 'true') {
      where.active = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

// POST /api/inventory - Crear producto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sku,
      name,
      description,
      type,
      price,
      cost,
      stock,
      minStock,
      imageUrl,
      categoryId,
      // Card fields
      cardId,
      cardName,
      cardSet,
      cardRarity,
      cardCondition,
      cardLanguage,
      cardData,
      // Sealed product fields
      setCode,
      releaseDate,
      arrivalDate,
      location,
      notes,
      active,
    } = body;

    // Validaciones
    if (!sku || !name || !type || price === undefined) {
      return NextResponse.json(
        { error: 'SKU, nombre, tipo y precio son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el SKU no exista
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: 'El SKU ya existe' }, { status: 400 });
    }

    // Crear producto
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        type,
        price: parseFloat(price),
        cost: cost ? parseFloat(cost) : null,
        stock: stock ? parseInt(stock) : 0,
        minStock: minStock ? parseInt(minStock) : 0,
        imageUrl,
        categoryId,
        // Card fields
        cardId: cardId ? parseInt(cardId) : null,
        cardName,
        cardSet,
        cardRarity,
        cardCondition,
        cardLanguage,
        cardData,
        // Sealed product fields
        setCode,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        location,
        notes,
        active: active !== undefined ? active : true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
