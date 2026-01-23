// Registration validation library for event registrations

import prisma from './prisma';
import { validateDeck } from './deck-validation';

export interface RegistrationValidationError {
  field: string;
  message: string;
}

export interface RegistrationValidationResult {
  valid: boolean;
  errors: RegistrationValidationError[];
}

/**
 * Validates a complete event registration
 */
export async function validateRegistration(
  userId: string,
  eventId: string,
  deckId: string
): Promise<RegistrationValidationResult> {
  const errors: RegistrationValidationError[] = [];

  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    errors.push({
      field: 'userId',
      message: 'Usuario no encontrado',
    });
    return { valid: false, errors };
  }

  // Validate event exists and is published
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    errors.push({
      field: 'eventId',
      message: 'Evento no encontrado',
    });
    return { valid: false, errors };
  }

  if (!event.published) {
    errors.push({
      field: 'eventId',
      message: 'Este evento no está disponible para inscripciones',
    });
  }

  // Validate event date hasn't passed
  const now = new Date();
  if (event.date < now) {
    errors.push({
      field: 'eventId',
      message: 'Este evento ya ha pasado',
    });
  }

  // Validate user isn't already registered
  const existingRegistration = await prisma.eventRegistration.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId,
      },
    },
  });

  if (existingRegistration) {
    errors.push({
      field: 'registration',
      message: 'Ya estás inscrito en este evento',
    });
  }

  // Validate deck exists and belongs to user
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      DeckCard: true,
    },
  });

  if (!deck) {
    errors.push({
      field: 'deckId',
      message: 'Mazo no encontrado',
    });
    return { valid: false, errors };
  }

  if (deck.userId !== userId) {
    errors.push({
      field: 'deckId',
      message: 'Este mazo no te pertenece',
    });
  }

  if (!deck.isActive) {
    errors.push({
      field: 'deckId',
      message: 'Este mazo está inactivo',
    });
  }

  // Validate deck structure
  const deckValidation = validateDeck({
    id: deck.id,
    name: deck.name,
    description: deck.description || undefined,
    format: deck.format || undefined,
    cards: deck.DeckCard.map(card => ({
      id: card.id,
      cardId: card.cardId,
      quantity: card.quantity,
      deckType: card.deckType as 'MAIN' | 'EXTRA' | 'SIDE',
      cardData: card.cardData,
    })),
  });

  if (!deckValidation.valid) {
    errors.push({
      field: 'deck',
      message: `El mazo tiene errores de validación: ${deckValidation.errors.map(e => e.message).join(', ')}`,
    });
  }

  // Validate available spots (if maxPlayers is set)
  if (event.maxPlayers) {
    const approvedCount = await prisma.eventRegistration.count({
      where: {
        eventId,
        status: 'APROBADO',
      },
    });

    if (approvedCount >= event.maxPlayers) {
      errors.push({
        field: 'event',
        message: 'Este evento ya alcanzó el máximo de jugadores permitidos',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates Konami ID format (alphanumeric)
 */
export function validateKonamiId(konamiId: string): boolean {
  if (!konamiId) return true; // Optional field

  // Konami ID should be alphanumeric, typically 10 digits
  const konamiIdRegex = /^[A-Za-z0-9]{6,12}$/;
  return konamiIdRegex.test(konamiId);
}

/**
 * Checks if a user can cancel their registration
 */
export async function canCancelRegistration(registrationId: string, userId: string): Promise<boolean> {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id: registrationId },
    include: {
      Event: true,
    },
  });

  if (!registration) {
    return false;
  }

  // Only the user who created the registration can cancel it
  if (registration.userId !== userId) {
    return false;
  }

  // Can only cancel if status is PENDIENTE
  if (registration.status !== 'PENDIENTE') {
    return false;
  }

  // Can only cancel if event hasn't started yet
  const now = new Date();
  if (registration.Event.date < now) {
    return false;
  }

  return true;
}

/**
 * Checks if a deck can be deleted
 */
export async function canDeleteDeck(deckId: string, userId: string): Promise<{ canDelete: boolean; reason?: string }> {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      EventRegistration: {
        where: {
          status: {
            in: ['PENDIENTE', 'APROBADO'],
          },
        },
      },
    },
  });

  if (!deck) {
    return { canDelete: false, reason: 'Mazo no encontrado' };
  }

  if (deck.userId !== userId) {
    return { canDelete: false, reason: 'Este mazo no te pertenece' };
  }

  // Cannot delete if used in active registrations
  if (deck.EventRegistration.length > 0) {
    return {
      canDelete: false,
      reason: `Este mazo está siendo usado en ${deck.EventRegistration.length} inscripción(es) activa(s)`,
    };
  }

  return { canDelete: true };
}
