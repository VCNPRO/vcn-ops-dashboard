import { prisma } from './prisma';
import { parseAndCalculateCosts } from './cost-calculator';

interface GitHubActionsUsage {
  total_minutes_used: number;
  total_paid_minutes_used: number;
  included_minutes: number;
}

/**
 * Fetch GitHub Actions usage for an organization or user
 */
export async function fetchGitHubActionsUsage(org?: string): Promise<GitHubActionsUsage> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const url = org
    ? `https://api.github.com/orgs/${org}/settings/billing/actions`
    : 'https://api.github.com/user/settings/billing/actions';

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Ingest GitHub Actions usage and calculate costs
 */
export async function ingestGitHubActions(org?: string) {
  const provider = await prisma.provider.findFirst({
    where: { type: 'github' },
  });

  if (!provider) {
    throw new Error('GitHub provider not found');
  }

  try {
    const usage = await fetchGitHubActionsUsage(org);

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
          usage: {
            actions_minutes: usage.total_paid_minutes_used,
          },
          source: 'github-api',
          org,
        } as any,
      },
    });

    // If we have a GitHub "app" entry, calculate costs
    const githubApp = await prisma.app.findFirst({
      where: { name: org || 'GitHub' },
    });

    if (githubApp && usage.total_paid_minutes_used > 0) {
      const costResult = await parseAndCalculateCosts(
        githubApp.id,
        provider.id,
        {
          date: startDate,
          usage: {
            actions_minutes: usage.total_paid_minutes_used,
          },
        }
      );

      return {
        success: true,
        rawBillingId: rawBilling.id,
        usage,
        costs: costResult.success ? costResult.totalCost : null,
      };
    }

    return {
      success: true,
      rawBillingId: rawBilling.id,
      usage,
      message: 'No app configured for GitHub, costs not calculated',
    };
  } catch (error: any) {
    console.error('Error ingesting GitHub Actions:', error);
    throw error;
  }
}
