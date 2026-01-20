import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[HEALTH] Starting health check...');

    // Test database connection
    console.log('[HEALTH] Attempting to connect to database...');
    await prisma.$connect();
    console.log('[HEALTH] Database connected!');

    // Test raw query first
    console.log('[HEALTH] Testing raw query...');
    const rawResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('[HEALTH] Raw query result:', rawResult);

    // Try simple queries
    console.log('[HEALTH] Testing Prisma queries...');
    const userCount = await prisma.user.count();
    console.log('[HEALTH] User count:', userCount);

    const eventCount = await prisma.event.count();
    console.log('[HEALTH] Event count:', eventCount);

    const deckCount = await prisma.deck.count();
    console.log('[HEALTH] Deck count:', deckCount);

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        prismaWorking: true,
        rawQueryWorking: true,
        counts: {
          users: userCount,
          events: eventCount,
          decks: deckCount,
        },
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasEmailFrom: !!process.env.EMAIL_FROM,
      },
    });
  } catch (error) {
    console.error('[HEALTH] ERROR:', error);
    console.error('[HEALTH] Error details:', {
      name: error instanceof Error ? error.name : 'unknown',
      message: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : 'unknown',
    });

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
          errorName: error instanceof Error ? error.name : 'unknown',
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!process.env.DATABASE_URL,
          hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasEmailFrom: !!process.env.EMAIL_FROM,
        },
      },
      { status: 500 }
    );
  }
}
