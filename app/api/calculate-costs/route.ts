import { NextResponse } from 'next/server';
import { parseAndCalculateCosts } from '@/lib/cost-calculator';

/**
 * Calculate costs from usage data
 *
 * POST body format:
 * {
 *   "appId": 1,
 *   "providerId": 2,
 *   "date": "2025-01-15",
 *   "usage": {
 *     "serverless_invocation": 1000000,
 *     "bandwidth_gb": 50.5
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appId, providerId, ...rawUsageData } = body;

    if (!appId || !providerId) {
      return NextResponse.json(
        { error: 'appId and providerId are required' },
        { status: 400 }
      );
    }

    const result = await parseAndCalculateCosts(
      parseInt(appId),
      parseInt(providerId),
      rawUsageData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error calculating costs:', error);
    return NextResponse.json(
      { error: 'Error calculating costs' },
      { status: 500 }
    );
  }
}
