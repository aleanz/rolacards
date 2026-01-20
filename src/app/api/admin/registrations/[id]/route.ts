import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        event: {
          include: {
            registrations: {
              where: {
                status: 'APROBADO',
              },
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Si se está aprobando, verificar que hay cupo disponible
    if (status === 'APROBADO' && registration.event.maxPlayers) {
      const approvedCount = registration.event.registrations.length;
      if (approvedCount >= registration.event.maxPlayers) {
        return NextResponse.json(
          { error: 'No hay cupo disponible en el evento' },
          { status: 400 }
        );
      }
    }

    // Procesar el comprobante de pago si existe
    let paymentProofUrl: string | undefined = undefined;
    let paymentProofType: string | undefined = undefined;

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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
        deck: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

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
