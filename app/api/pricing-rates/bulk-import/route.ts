import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Bulk import pricing rates from JSON
 *
 * Expected format:
 * {
 *   "vercel": {
 *     "serverless_invocation": 0.000016,
 *     "bandwidth_gb": 0.09
 *   },
 *   "twilio": {
 *     "sms_sent": 0.0075
 *   }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rates, effectiveDate, currency = 'USD' } = body;

    if (!rates || typeof rates !== 'object') {
      return NextResponse.json(
        { error: 'Invalid rates format' },
        { status: 400 }
      );
    }

    const imported = [];
    const errors = [];

    for (const [providerType, resources] of Object.entries(rates)) {
      // Find or create provider
      let provider = await prisma.provider.findFirst({
        where: { type: providerType },
      });

      if (!provider) {
        provider = await prisma.provider.create({
          data: {
            name: providerType.charAt(0).toUpperCase() + providerType.slice(1),
            type: providerType,
          },
        });
      }

      // Import each resource type rate
      for (const [resourceType, unitPrice] of Object.entries(resources as Record<string, number>)) {
        try {
          const rate = await prisma.pricingRate.upsert({
            where: {
              providerId_resourceType_effectiveDate: {
                providerId: provider.id,
                resourceType,
                effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
              },
            },
            update: {
              unitPrice,
              currency,
            },
            create: {
              providerId: provider.id,
              resourceType,
              unitPrice,
              currency,
              effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
            },
          });

          imported.push(rate);
        } catch (error: any) {
          errors.push({
            provider: providerType,
            resourceType,
            error: error.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined,
      rates: imported,
    }, { status: 201 });
  } catch (error) {
    console.error('Error bulk importing pricing rates:', error);
    return NextResponse.json(
      { error: 'Error bulk importing pricing rates' },
      { status: 500 }
    );
  }
}
