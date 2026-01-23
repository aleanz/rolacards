import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/settings - Obtener configuraciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Obtener una configuración específica
      const setting = await prisma.storeSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
      }

      return NextResponse.json(setting);
    } else {
      // Obtener todas las configuraciones
      const settings = await prisma.storeSetting.findMany({
        orderBy: { key: 'asc' },
      });

      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error al obtener configuraciones' }, { status: 500 });
  }
}

// POST /api/settings - Crear o actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value, type } = body;

    // Validaciones
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Clave y valor son requeridos' },
        { status: 400 }
      );
    }

    // Crear o actualizar configuración
    const setting = await prisma.storeSetting.upsert({
      where: { key },
      update: {
        value: String(value),
        type: type || 'STRING',
        updatedAt: new Date(),
      },
      create: {
        id: randomUUID(),
        key,
        value: String(value),
        type: type || 'STRING',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}

// PUT /api/settings - Actualizar múltiples configuraciones
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Se requiere un array de configuraciones' },
        { status: 400 }
      );
    }

    // Actualizar todas las configuraciones
    const results = await Promise.all(
      settings.map((setting: { key: string; value: string; type?: string }) =>
        prisma.storeSetting.upsert({
          where: { key: setting.key },
          update: {
            value: String(setting.value),
            type: (setting.type || 'STRING') as any,
            updatedAt: new Date(),
          },
          create: {
            id: randomUUID(),
            key: setting.key,
            value: String(setting.value),
            type: (setting.type || 'STRING') as any,
            updatedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Error al actualizar configuraciones' }, { status: 500 });
  }
}
