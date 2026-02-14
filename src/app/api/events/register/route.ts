import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { calculateGenesysPoints, validateDeckAgainstBanlist } from '@/lib/banlist';
import { sendRegistrationCreatedEmail, sendAdminNotificationEmail } from '@/lib/email';

// Mapeo de formatos equivalentes (evento vs deck builder)
const FORMAT_ALIASES: Record<string, string[]> = {
  'tcg': ['tcg', 'avanzado', 'advanced'],
  'ocg': ['ocg'],
  'goat': ['goat'],
  'edison': ['edison'],
  'genesys': ['genesys'],
};

function formatsMatch(deckFormat: string | null, eventFormat: string | null): boolean {
  if (!eventFormat || !deckFormat) return true;
  const deckLower = deckFormat.toLowerCase();
  const eventLower = eventFormat.toLowerCase();
  if (deckLower === eventLower) return true;
  for (const aliases of Object.values(FORMAT_ALIASES)) {
    if (aliases.includes(deckLower) && aliases.includes(eventLower)) return true;
  }
  return false;
}

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
        EventRegistration: {
          where: {
            status: { in: ['PENDIENTE', 'APROBADO'] },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Verificar que el evento está vigente (no ha pasado, usando hora de México)
    const mexicoToday = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    const todayStart = new Date(mexicoToday + 'T00:00:00.000Z');
    if (event.date < todayStart) {
      return NextResponse.json(
        { error: 'Este evento ya pasó. No se pueden realizar nuevas inscripciones.' },
        { status: 400 }
      );
    }

    // Verificar que el tipo de evento permite inscripciones
    const allowedEventTypes = ['TOURNAMENT', 'SNEAK_PEEK'];
    if (!allowedEventTypes.includes(event.type)) {
      return NextResponse.json(
        { error: 'Este tipo de evento no permite inscripciones. Solo puedes inscribirte en torneos y sneak peeks.' },
        { status: 400 }
      );
    }

    // Verificar que hay cupo disponible
    if (event.maxPlayers && event.EventRegistration.length >= event.maxPlayers) {
      return NextResponse.json(
        { error: 'No hay cupo disponible para este evento' },
        { status: 400 }
      );
    }

    // Verificar que el mazo existe y pertenece al usuario
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        DeckCard: true,
      },
    });

    if (!deck || deck.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Mazo no encontrado o no tienes permiso' },
        { status: 403 }
      );
    }

    // Verificar que el formato del mazo coincide con el del evento
    if (event.format && !formatsMatch(deck.format, event.format)) {
      return NextResponse.json(
        {
          error: `El mazo debe ser del formato ${event.format}. Tu mazo es ${deck.format || 'sin formato'}`,
        },
        { status: 400 }
      );
    }

    // Validar el mazo contra la banlist del formato
    if (event.format) {
      // Transform DeckCard to the format expected by validateDeckAgainstBanlist
      const deckCards = deck.DeckCard.map(card => ({
        cardData: card.cardData,
        quantity: card.quantity,
        placement: card.deckType.toLowerCase(),
      }));

      const banlistErrors = validateDeckAgainstBanlist(deckCards, event.format as any);

      if (banlistErrors.length > 0) {
        const errorMessages = banlistErrors.map(err =>
          `${err.cardName}: ${err.reason} (tienes ${err.quantity}, máximo ${err.maxAllowed})`
        ).join('; ');

        return NextResponse.json(
          {
            error: `Tu mazo no cumple con las reglas de banlist del formato ${event.format}`,
            details: errorMessages,
          },
          { status: 400 }
        );
      }
    }

    // Verificar límite de puntos Genesys si el formato es Genesys
    if (event.format === 'genesys' && (event as any).genesysPointsLimit) {
      const deckPoints = calculateGenesysPoints(deck.DeckCard);
      const pointsLimit = (event as any).genesysPointsLimit;

      if (deckPoints > pointsLimit) {
        return NextResponse.json(
          {
            error: `Tu mazo excede el límite de puntos Genesys. Tiene ${deckPoints} puntos y el límite es ${pointsLimit}`,
          },
          { status: 400 }
        );
      }
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
      const fileName = `${randomUUID()}.${fileExtension}`;
      const filePath = join(uploadsDir, fileName);

      // Guardar archivo
      await writeFile(filePath, buffer);

      paymentProofUrl = `/uploads/payment-proofs/${fileName}`;
      paymentProofType = paymentProofFile.type;
    }

    // Crear la solicitud de inscripción
    const registration = await prisma.eventRegistration.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        eventId: eventId,
        deckId: deckId,
        transferReference: transferReference || undefined,
        paymentProof: paymentProofUrl,
        paymentProofType: paymentProofType,
        status: 'PENDIENTE',
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        Event: {
          select: {
            title: true,
            date: true,
          },
        },
        Deck: {
          select: {
            name: true,
          },
        },
      },
    });

    // Enviar correo de confirmación al usuario
    await sendRegistrationCreatedEmail(
      registration.User.email!,
      registration.User.name || 'Usuario',
      registration.Event.title,
      registration.Event.date,
      registration.Deck.name,
      !!paymentProofUrl
    );

    // Obtener emails de todos los admins/staff
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'STAFF'],
        },
      },
      select: {
        email: true,
      },
    });

    const adminEmails = admins.map(admin => admin.email).filter((email): email is string => !!email);

    // Enviar notificación a admins
    if (adminEmails.length > 0) {
      await sendAdminNotificationEmail(
        adminEmails,
        registration.User.name || 'Usuario',
        registration.User.email!,
        registration.Event.title,
        registration.Deck.name,
        registration.id,
        !!paymentProofUrl
      );
    }

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
