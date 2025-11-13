import { prisma } from './prisma';
import { parseAndCalculateCosts } from './cost-calculator';

interface VercelUsageData {
  serverless_invocation?: number;
  bandwidth_gb?: number;
  build_minutes?: number;
  edge_function_invocation?: number;
}

/**
 * Fetch Vercel usage data for a project
 */
export async function fetchVercelProjectUsage(
  projectId: string,
  startDate: Date,
  endDate: Date
): Promise<VercelUsageData> {
  const token = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    throw new Error('VERCEL_TOKEN not configured');
  }

  // Build query params
  const params = new URLSearchParams();
  if (teamId) params.append('teamId', teamId);
  params.append('since', Math.floor(startDate.getTime() / 1000).toString());
  params.append('until', Math.floor(endDate.getTime() / 1000).toString());
  params.append('projectId', projectId);

  // Fetch deployment stats
  const deploymentsUrl = `https://api.vercel.com/v6/deployments?${params.toString()}`;
  const deploymentsRes = await fetch(deploymentsUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!deploymentsRes.ok) {
    throw new Error(`Vercel API error: ${deploymentsRes.status}`);
  }

  const deploymentsData = await deploymentsRes.json();

  // Extract usage metrics from deployments
  // This is a simplified example - adjust based on actual Vercel API response
  const usage: VercelUsageData = {
    serverless_invocation: 0,
    bandwidth_gb: 0,
    build_minutes: 0,
  };

  // Parse deployments and aggregate usage
  if (deploymentsData.deployments) {
    for (const deployment of deploymentsData.deployments) {
      // Add logic to extract usage from deployment data
      // This depends on what Vercel API provides
      usage.build_minutes = (usage.build_minutes || 0) + (deployment.buildDuration || 0) / 60000;
    }
  }

  return usage;
}

/**
 * Ingest Vercel usage for all apps
 */
export async function ingestAllVercelApps() {
  const provider = await prisma.provider.findFirst({
    where: { type: 'vercel' },
  });

  if (!provider) {
    throw new Error('Vercel provider not found');
  }

  const apps = await prisma.app.findMany({
    where: { vercelProjectId: { not: null } },
  });

  const results = [];
  const errors = [];

  // Calculate date range (yesterday)
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 1);

  for (const app of apps) {
    try {
      // Fetch usage from Vercel
      const usage = await fetchVercelProjectUsage(
        app.vercelProjectId!,
        startDate,
        endDate
      );

      // Store raw billing
      const rawBilling = await prisma.rawBilling.create({
        data: {
          providerId: provider.id,
          appId: app.id,
          raw: {
            date: startDate.toISOString().split('T')[0],
            usage,
            source: 'vercel-api',
          },
        },
      });

      // Calculate costs
      const costResult = await parseAndCalculateCosts(app.id, provider.id, {
        date: startDate,
        usage,
      });

      results.push({
        appId: app.id,
        appName: app.name,
        rawBillingId: rawBilling.id,
        usage,
        costs: costResult.success ? costResult.totalCost : null,
        breakdown: costResult.breakdown,
      });
    } catch (error: any) {
      errors.push({
        appId: app.id,
        appName: app.name,
        error: error.message,
      });
    }
  }

  return {
    success: true,
    processed: results.length,
    failed: errors.length,
    results,
    errors,
  };
}

/**
 * Manually trigger ingestion with custom usage data
 * Useful for testing or manual data entry
 */
export async function ingestVercelUsageManual(
  appId: number,
  date: Date,
  usage: VercelUsageData
) {
  const provider = await prisma.provider.findFirst({
    where: { type: 'vercel' },
  });

  if (!provider) {
    throw new Error('Vercel provider not found');
  }

  const app = await prisma.app.findUnique({
    where: { id: appId },
  });

  if (!app) {
    throw new Error('App not found');
  }

  // Store raw billing
  const rawBilling = await prisma.rawBilling.create({
    data: {
      providerId: provider.id,
      appId: app.id,
      raw: {
        date: date.toISOString().split('T')[0],
        usage,
        source: 'manual',
      },
    },
  });

  // Calculate costs
  const costResult = await parseAndCalculateCosts(app.id, provider.id, {
    date,
    usage,
  });

  return {
    success: true,
    rawBillingId: rawBilling.id,
    costs: costResult,
  };
}
