import { prisma } from './prisma';
import { parseAndCalculateCosts } from './cost-calculator';

interface CloudflareAnalytics {
  requests: {
    all: number;
    cached: number;
    uncached: number;
  };
  bandwidth: {
    all: number;
    cached: number;
    uncached: number;
  };
  threats: {
    all: number;
  };
}

/**
 * Fetch Cloudflare analytics for a zone
 */
export async function fetchCloudflareAnalytics(zoneId: string): Promise<CloudflareAnalytics> {
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    throw new Error('CLOUDFLARE_API_TOKEN not configured');
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API error: ${response.status}`);
  }

  const data = await response.json();
  return data.result.totals;
}

/**
 * Ingest Cloudflare analytics and calculate costs
 */
export async function ingestCloudflareAnalytics(zoneId?: string) {
  const provider = await prisma.provider.findFirst({
    where: { type: 'cloudflare' },
  });

  if (!provider) {
    throw new Error('Cloudflare provider not found');
  }

  if (!zoneId) {
    return {
      success: false,
      message: 'CLOUDFLARE_ZONE_ID not configured',
      processed: 0,
    };
  }

  try {
    const analytics = await fetchCloudflareAnalytics(zoneId);

    // Calculate date range (yesterday)
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1);

    // Store raw billing
    const rawBilling = await prisma.rawBilling.create({
      data: {
        providerId: provider.id,
        raw: {
          date: startDate.toISOString().split('T')[0],
          analytics,
          source: 'cloudflare-api',
          zoneId,
        } as any,
      },
    });

    // If we have a Cloudflare app entry, calculate costs
    const cloudflareApp = await prisma.app.findFirst({
      where: { name: 'Cloudflare' },
    });

    if (cloudflareApp && analytics.requests.all > 0) {
      const costResult = await parseAndCalculateCosts(
        cloudflareApp.id,
        provider.id,
        {
          date: startDate,
          usage: {
            requests: analytics.requests.all,
            bandwidth_gb: analytics.bandwidth.all / (1024 * 1024 * 1024),
          },
        }
      );

      return {
        success: true,
        rawBillingId: rawBilling.id,
        analytics,
        costs: costResult.success ? costResult.totalCost : null,
      };
    }

    return {
      success: true,
      rawBillingId: rawBilling.id,
      analytics,
      message: 'No app configured for Cloudflare, costs not calculated',
    };
  } catch (error: any) {
    console.error('Error ingesting Cloudflare analytics:', error);
    throw error;
  }
}
