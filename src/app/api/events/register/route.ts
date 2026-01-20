import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const eventId = formData.get('eventId') as string;
    const deckId = formData.get('deckId') as string;
    const transferReference = formData.get('transferReference') as string | null;
    const paymentProofFile = formData.get('paymentProof') as File | null;

    if (!eventId || !deckId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: {
            status: { in: ['PENDIENTE', 'APROBADO'] },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Verificar que hay cupo disponible
    if (event.maxPlayers && event.registrations.length >= event.maxPlayers) {
      return NextResponse.json(
        { error: 'No hay cupo disponible para este evento' },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe y pertenece al usuario
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck || deck.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Mazo no encontrado o no tienes permiso' },
        { status: 403 }
      );
    }

    // Verificar que el formato del mazo coincide con el del evento
    if (event.format && deck.format !== event.format) {
      return NextResponse.json(
        {
          error: `El mazo debe ser del formato ${event.format}. Tu mazo es ${deck.format || 'sin formato'}`,
        },
        { status: 400 }
      );
    }

    // Verificar que no esté ya inscrito
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya estás inscrito en este evento' },
        { status: 400 }
      );
    }

    // Procesar el comprobante de pago si existe
    let paymentProofUrl: string | null = null;
    let paymentProofType: string | null = null;

    if (paymentProofFile) {
      const bytes = await paymentProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Crear directorio si no existe
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }

      // Generar nombre único para el archivo
      const fileExtension = paymentProofFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);

      // Guardar archivo
      await writeFile(filePath, buffer);

      paymentProofUrl = `/uploads/payment-proofs/${fileName}`;
      paymentProofType = paymentProofFile.type;
    }

    // Crear la solicitud de inscripción
    const registration = await prisma.eventRegistration.create({
      data: {
        userId: session.user.id,
        eventId: eventId,
        deckId: deckId,
        transferReference: transferReference || undefined,
        paymentProof: paymentProofUrl,
        paymentProofType: paymentProofType,
        status: 'PENDIENTE',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
          },
        },
        deck: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Solicitud de inscripción enviada exitosamente',
      registration,
    });
  } catch (error) {
    console.error('Error creating event registration:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
