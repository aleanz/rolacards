import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canCancelRegistration } from '@/lib/registration-validation';

// GET /api/registrations/[id] - Get specific registration with full deck details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            konamiId: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            date: true,
            endDate: true,
            location: true,
            format: true,
            entryFee: true,
            maxPlayers: true,
            prizeInfo: true,
            imageUrl: true,
          },
        },
        deck: {
          include: {
            cards: {
              orderBy: {
                deckType: 'asc',
              },
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada' },
        { status: 404 }
      );
    }

    // Check permissions: owner or admin/staff can view
    const isOwner = registration.userId === session.user.id;
    const isAdminOrStaff = session.user.role === 'ADMIN' || session.user.role === 'STAFF';

    if (!isOwner && !isAdminOrStaff) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta inscripción' },
        { status: 403 }
      );
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error fetching registration:', error);
    return NextResponse.json(
      { error: 'Error al obtener inscripción' },
      { status: 500 }
    );
  }
}

// PATCH /api/registrations/[id] - Update registration status (Admin/Staff only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Only Admin and Staff can update status
    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar inscripciones' },
        { status: 403 }
      );
    }

    const registration = await prisma.eventRegistration.findUnique({
      where: { id: params.id },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Inscripción no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, rejectionNote } = body;

    // Validate status
    if (!status || !['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    // If rejecting, rejection note is required
    if (status === 'RECHAZADO' && !rejectionNote) {
      return NextResponse.json(
        { error: 'Debe proporcionar un motivo de rechazo' },
        { status: 400 }
      );
    }

    // Update registration
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: params.id },
      data: {
        status,
        rejectionNote: status === 'RECHAZADO' ? rejectionNote : null,
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
      },
    });

    return NextResponse.json({
      message: 'Inscripción actualizada exitosamente',
      registration: updatedRegistration,
    });
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inscripción' },
      { status: 500 }
    );
  }
}

// DELETE /api/registrations/[id] - Cancel registration (user can only cancel their own)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Check if user can cancel this registration
    const canCancel = await canCancelRegistration(params.id, session.user.id);

    if (!canCancel) {
      return NextResponse.json(
        { error: 'No puedes cancelar esta inscripción' },
        { status: 400 }
      );
    }

    // Delete registration
    await prisma.eventRegistration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Inscripción cancelada exitosamente',
    });
  } catch (error) {
    console.error('Error canceling registration:', error);
    return NextResponse.json(
      { error: 'Error al cancelar inscripción' },
      { status: 500 }
    );
  }
}
