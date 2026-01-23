import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// PATCH /api/events/my-registrations/[id] - Actualizar comprobante de pago o mazo
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const paymentProofFile = formData.get('paymentProof') as File | null;
    const transferReference = formData.get('transferReference') as string | null;
    const deckId = formData.get('deckId') as string | null;

    // Verificar que la inscripción pertenece al usuario
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        event: true,
        deck: true,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada' },
        { status: 404 }
      );
    }

    if (registration.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar esta inscripción' },
        { status: 403 }
      );
    }

    // Procesar comprobante de pago si existe
    let paymentProofUrl: string | undefined = undefined;

    if (paymentProofFile) {
      const bytes = await paymentProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
      await mkdir(uploadDir, { recursive: true });

      const extension = paymentProofFile.name.split('.').pop();
      const filename = `${randomUUID()}.${extension}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      paymentProofUrl = `/uploads/payment-proofs/${filename}`;
    }

    // Verificar que el mazo pertenece al usuario si se quiere cambiar
    if (deckId) {
      const deck = await prisma.deck.findUnique({
        where: { id: deckId },
      });

      if (!deck || deck.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Mazo no encontrado o no te pertenece' },
          { status: 400 }
        );
      }

      // Verificar formato del mazo
      if (registration.event.format && deck.format?.toLowerCase() !== registration.event.format.toLowerCase()) {
        return NextResponse.json(
          { error: `El mazo debe ser del formato ${registration.event.format}` },
          { status: 400 }
        );
      }
    }

    // Actualizar inscripción
    const updateData: any = {};

    if (paymentProofUrl) {
      updateData.paymentProof = paymentProofUrl;
    }

    if (transferReference) {
      updateData.transferReference = transferReference;
    }

    if (deckId) {
      updateData.deckId = deckId;
    }

    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: params.id },
      data: updateData,
      include: {
        event: true,
        deck: true,
      },
    });

    return NextResponse.json({
      message: 'Inscripción actualizada exitosamente',
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la inscripción' },
      { status: 500 }
    );
  }
}
