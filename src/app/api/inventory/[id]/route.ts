import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/inventory/[id] - Obtener producto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        Category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Formatear para catálogo público
    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      sku: product.sku,
      cardCode: product.setCode,
      category: product.Category?.slug || 'OTHER',
      condition: product.cardCondition,
      rarity: product.cardRarity,
      imageUrl: product.imageUrl,
      active: product.active,
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 });
  }
}

// PATCH /api/inventory/[id] - Actualizar producto
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: any = {};

    // Campos básicos
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.cost !== undefined) updateData.cost = body.cost ? parseFloat(body.cost) : null;
    if (body.stock !== undefined) updateData.stock = parseInt(body.stock);
    if (body.minStock !== undefined) updateData.minStock = parseInt(body.minStock);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.active !== undefined) updateData.active = body.active;

    // Card fields
    if (body.cardId !== undefined) updateData.cardId = body.cardId ? parseInt(body.cardId) : null;
    if (body.cardName !== undefined) updateData.cardName = body.cardName;
    if (body.cardSet !== undefined) updateData.cardSet = body.cardSet;
    if (body.cardRarity !== undefined) updateData.cardRarity = body.cardRarity;
    if (body.cardCondition !== undefined) updateData.cardCondition = body.cardCondition;
    if (body.cardLanguage !== undefined) updateData.cardLanguage = body.cardLanguage;
    if (body.cardData !== undefined) updateData.cardData = body.cardData;

    // Sealed product fields
    if (body.setCode !== undefined) updateData.setCode = body.setCode;
    if (body.releaseDate !== undefined) updateData.releaseDate = body.releaseDate ? new Date(body.releaseDate) : null;
    if (body.arrivalDate !== undefined) updateData.arrivalDate = body.arrivalDate ? new Date(body.arrivalDate) : null;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        Category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

// DELETE /api/inventory/[id] - Eliminar producto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
