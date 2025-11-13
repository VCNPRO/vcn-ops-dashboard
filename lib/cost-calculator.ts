import { prisma } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

interface UsageMetric {
  resourceType: string;
  quantity: number;
  date: Date;
}

interface CalculatedCost {
  resourceType: string;
  quantity: number;
  unitPrice: Decimal;
  totalCost: Decimal;
  currency: string;
}

/**
 * Get the pricing rate for a resource type at a specific date
 */
export async function getPricingRate(
  providerId: number,
  resourceType: string,
  date: Date = new Date()
) {
  const rate = await prisma.pricingRate.findFirst({
    where: {
      providerId,
      resourceType,
      effectiveDate: {
        lte: date,
      },
    },
    orderBy: {
      effectiveDate: 'desc',
    },
  });

  return rate;
}

/**
 * Calculate cost for a single usage metric
 */
export async function calculateCost(
  providerId: number,
  metric: UsageMetric
): Promise<CalculatedCost | null> {
  const rate = await getPricingRate(providerId, metric.resourceType, metric.date);

  if (!rate) {
    console.warn(
      `No pricing rate found for provider ${providerId}, resource ${metric.resourceType}`
    );
    return null;
  }

  const totalCost = new Decimal(rate.unitPrice).mul(metric.quantity);

  return {
    resourceType: metric.resourceType,
    quantity: metric.quantity,
    unitPrice: rate.unitPrice,
    totalCost,
    currency: rate.currency,
  };
}

/**
 * Calculate costs for multiple usage metrics and aggregate by date
 */
export async function calculateCosts(
  providerId: number,
  metrics: UsageMetric[]
): Promise<CalculatedCost[]> {
  const costs: CalculatedCost[] = [];

  for (const metric of metrics) {
    const cost = await calculateCost(providerId, metric);
    if (cost) {
      costs.push(cost);
    }
  }

  return costs;
}

/**
 * Process usage data and create daily costs
 */
export async function processUsageAndCreateDailyCosts(
  appId: number,
  providerId: number,
  date: Date,
  metrics: UsageMetric[]
): Promise<any> {
  const costs = await calculateCosts(providerId, metrics);

  if (costs.length === 0) {
    return { success: false, error: 'No costs calculated' };
  }

  // Sum all costs for the day
  const totalCost = costs.reduce(
    (sum, cost) => sum.add(cost.totalCost),
    new Decimal(0)
  );

  // Use the currency from the first cost (all should be the same)
  const currency = costs[0].currency;

  // Create notes with breakdown
  const breakdown = costs.map(
    (c) => `${c.resourceType}: ${c.quantity} × $${c.unitPrice} = $${c.totalCost}`
  );
  const notes = `Calculated from usage metrics:\n${breakdown.join('\n')}`;

  // Upsert daily cost
  const dailyCost = await prisma.dailyCost.upsert({
    where: {
      appId_date_providerId: {
        appId,
        date,
        providerId,
      },
    },
    update: {
      costLocal: totalCost,
      currency,
      notes,
    },
    create: {
      appId,
      date,
      providerId,
      costLocal: totalCost,
      currency,
      notes,
    },
  });

  return {
    success: true,
    dailyCost,
    breakdown: costs,
    totalCost: totalCost.toString(),
  };
}

/**
 * Parse usage data from raw JSON and calculate costs
 *
 * Expected format:
 * {
 *   "date": "2025-01-15",
 *   "usage": {
 *     "serverless_invocation": 1000000,
 *     "bandwidth_gb": 50.5
 *   }
 * }
 */
export async function parseAndCalculateCosts(
  appId: number,
  providerId: number,
  rawUsageData: any
): Promise<any> {
  const date = rawUsageData.date ? new Date(rawUsageData.date) : new Date();
  const usage = rawUsageData.usage || {};

  const metrics: UsageMetric[] = Object.entries(usage).map(
    ([resourceType, quantity]) => ({
      resourceType,
      quantity: Number(quantity),
      date,
    })
  );

  return processUsageAndCreateDailyCosts(appId, providerId, date, metrics);
}
