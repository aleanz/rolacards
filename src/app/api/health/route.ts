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
    const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    console.log('[HEALTH] Raw query result:', rawResult);

    // Try a simple query
    console.log('[HEALTH] Testing Prisma queries...');
    const userCount = await prisma.user.count();
    console.log('[HEALTH] User count:', userCount);

    const eventCount = await prisma.event.count();
    console.log('[HEALTH] Event count:', eventCount);

    const settingCount = await prisma.storeSetting.count();
    console.log('[HEALTH] Setting count:', settingCount);

    // Try to fetch one event
    console.log('[HEALTH] Fetching one event...');
    const oneEvent = await prisma.event.findFirst();
    console.log('[HEALTH] First event:', oneEvent ? { id: oneEvent.id, title: oneEvent.title } : null);

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      prisma: 'working',
      rawQuery: 'working',
      counts: {
        users: userCount,
        events: eventCount,
        settings: settingCount,
      },
      sampleEvent: oneEvent ? { id: oneEvent.id, title: oneEvent.title } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
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
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'unknown',
        stack: error instanceof Error ? error.stack : undefined,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
        },
      },
      { status: 500 }
    );
  }
}
