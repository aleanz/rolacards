import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Security: Require a secret key
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.SYNC_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      );
    }

    console.log('[SYNC] Starting schema sync...');
    console.log('[SYNC] DATABASE_URL present:', !!process.env.DATABASE_URL);

    // Run prisma db push
    console.log('[SYNC] Running prisma db push...');

    const { stdout, stderr } = await execAsync('npx prisma db push --skip-generate --accept-data-loss', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
      cwd: process.cwd(),
    });

    console.log('[SYNC] stdout:', stdout);
    if (stderr) {
      console.log('[SYNC] stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Schema synchronized successfully',
      output: stdout,
      errors: stderr || null,
    });
  } catch (error) {
    console.error('[SYNC] ERROR:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
