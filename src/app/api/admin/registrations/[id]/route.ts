import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { sendRegistrationNotification } from '@/lib/email';
import { validateDeckAgainstBanlist } from '@/lib/banlist';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'STAFF'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const status = formData.get('status') as string;
    const rejectionNote = formData.get('rejectionNote') as string | null;
    const paymentProofFile = formData.get('paymentProof') as File | null;

    if (!status || !['APROBADO', 'RECHAZADO', 'PENDIENTE'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.id },
      include: {
        Event: {
          include: {
            EventRegistration: {
              where: {
                status: 'APROBADO',
              },
            },
          },
        },
        Deck: {
          include: {
            DeckCard: true,
          },
        },
        User: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Si se está aprobando, realizar validaciones adicionales
    if (status === 'APROBADO') {
      // Verificar que hay cupo disponible
      if (registration.Event.maxPlayers) {
        const approvedCount = registration.Event.EventRegistration.length;
        if (approvedCount >= registration.Event.maxPlayers) {
          return NextResponse.json(
            { error: 'No hay cupo disponible en el evento' },
            { status: 400 }
          );
        }
      }

      // Verificar que hay comprobante de pago (existente o nuevo)
      const hasPaymentProof = registration.paymentProof || paymentProofFile;
      if (!hasPaymentProof) {
        return NextResponse.json(
          { error: 'No se puede aprobar una solicitud sin comprobante de pago. Por favor, solicita al usuario que suba su comprobante o súbelo tú mismo.' },
          { status: 400 }
        );
      }

      // Validar el mazo contra la banlist
      if (registration.Event.format) {
        // Transform DeckCard to the format expected by validateDeckAgainstBanlist
        const deckCards = registration.Deck.DeckCard.map(card => ({
          cardData: card.cardData,
          quantity: card.quantity,
          placement: card.deckType.toLowerCase(), // MAIN, EXTRA, SIDE -> main, extra, side
        }));

        const banlistErrors = validateDeckAgainstBanlist(
          deckCards,
          registration.Event.format as any
        );

        if (banlistErrors.length > 0) {
          const errorMessages = banlistErrors.map(err =>
            `${err.cardName}: ${err.reason}`
          ).join('; ');

          return NextResponse.json(
            {
              error: 'No se puede aprobar: El mazo no cumple con las reglas de banlist del formato',
              details: errorMessages,
            },
            { status: 400 }
          );
        }
      }
    }

    // Procesar el comprobante de pago si existe
    let paymentProofUrl: string | undefined = undefined;
    let paymentProofType: string | undefined = undefined;

    if (paymentProofFile) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(paymentProofFile.type)) {
        return NextResponse.json(
          { error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WEBP) y PDF.' },
          { status: 400 }
        );
      }

      // Validar tamaño (máximo 5MB)
      if (paymentProofFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'El archivo es demasiado grande. Máximo 5MB.' },
          { status: 400 }
        );
      }

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

    // Actualizar la solicitud
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'APROBADO') {
      updateData.paymentVerified = true;
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = session.user.id;
    }

    if (status === 'RECHAZADO' && rejectionNote) {
      updateData.rejectionNote = rejectionNote;
    }

    if (paymentProofUrl) {
      updateData.paymentProof = paymentProofUrl;
      updateData.paymentProofType = paymentProofType;
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: params.id },
      data: updateData,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
        Deck: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Enviar correo de notificación al usuario (solo para APROBADO o RECHAZADO)
    if (status === 'APROBADO' || status === 'RECHAZADO') {
      await sendRegistrationNotification(
        updatedRegistration.User.email!,
        updatedRegistration.User.name || 'Usuario',
        updatedRegistration.Event.title,
        status as 'APROBADO' | 'RECHAZADO',
        rejectionNote || undefined
      );
    }

    return NextResponse.json({
      message: 'Solicitud actualizada exitosamente',
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la solicitud' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.eventRegistration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Solicitud eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la solicitud' },
      { status: 500 }
    );
  }
}
