import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ingestAllVercelApps } from '@/lib/ingest-vercel';

/**
 * Ingest usage data from multiple providers and calculate costs
 *
 * Authentication: Bearer token in Authorization header
 * POST body: { "targets": ["vercel", "twilio", "github"] }
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.INGEST_TOKEN;

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'INGEST_TOKEN not configured on server' },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const targets = body.targets || [];

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: 'targets array is required' },
        { status: 400 }
      );
    }

    const results: any = {
      success: true,
      timestamp: new Date().toISOString(),
      ingested: [],
      errors: [],
    };

    // Process each target
    for (const target of targets) {
      try {
        let result;

        switch (target.toLowerCase()) {
          case 'vercel':
            result = await ingestVercel();
            break;
          case 'twilio':
            result = await ingestTwilio();
            break;
          case 'github':
            result = await ingestGitHub();
            break;
          default:
            results.errors.push({
              target,
              error: `Unknown target: ${target}`,
            });
            continue;
        }

        results.ingested.push({
          target,
          ...result,
        });
      } catch (error: any) {
        results.errors.push({
          target,
          error: error.message,
        });
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in ingest endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to ingest data', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Ingest Vercel usage data
 */
async function ingestVercel() {
  return await ingestAllVercelApps();
}

/**
 * Ingest Twilio usage data
 */
async function ingestTwilio() {
  const provider = await prisma.provider.findFirst({
    where: { type: 'twilio' },
  });

  if (!provider) {
    throw new Error('Twilio provider not found in database');
  }

  // Placeholder for Twilio ingestion
  // Implement based on your Twilio usage patterns

  return {
    processed: 0,
    message: 'Twilio ingestion not yet implemented',
  };
}

/**
 * Ingest GitHub usage data
 */
async function ingestGitHub() {
  const provider = await prisma.provider.findFirst({
    where: { type: 'github' },
  });

  if (!provider) {
    throw new Error('GitHub provider not found in database');
  }

  // Placeholder for GitHub ingestion
  // Implement based on your GitHub usage patterns

  return {
    processed: 0,
    message: 'GitHub ingestion not yet implemented',
  };
}
