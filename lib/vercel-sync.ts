import { prisma } from './prisma';

interface VercelProject {
  id: string;
  name: string;
  link?: {
    type: string;
    repo: string;
  };
  targets?: {
    production?: {
      alias?: string[];
    };
  };
}

/**
 * Sync Vercel projects to the database
 */
export async function syncVercelProjects() {
  try {
    // Fetch projects from Vercel API
    const response = await fetch('/api/vercel/projects');
    if (!response.ok) {
      throw new Error('Failed to fetch Vercel projects');
    }

    const data = await response.json();
    const projects: VercelProject[] = data.projects || [];

    // Ensure Vercel provider exists
    let vercelProvider = await prisma.provider.findFirst({
      where: { type: 'vercel' },
    });

    if (!vercelProvider) {
      vercelProvider = await prisma.provider.create({
        data: {
          name: 'Vercel',
          type: 'vercel',
        },
      });
    }

    // Sync each project
    const synced = [];
    for (const project of projects) {
      const domain = project.targets?.production?.alias?.[0];
      const repoUrl = project.link?.repo
        ? `https://github.com/${project.link.repo}`
        : null;

      const app = await prisma.app.upsert({
        where: { vercelProjectId: project.id },
        update: {
          name: project.name,
          domain,
          repoUrl: repoUrl || undefined,
        },
        create: {
          name: project.name,
          domain,
          repoUrl: repoUrl || undefined,
          vercelProjectId: project.id,
        },
      });

      synced.push(app);
    }

    return { success: true, count: synced.length, apps: synced };
  } catch (error) {
    console.error('Error syncing Vercel projects:', error);
    throw error;
  }
}

/**
 * Fetch and store Vercel usage data
 */
export async function syncVercelUsage(since?: number, until?: number) {
  try {
    const params = new URLSearchParams();
    if (since) params.append('since', since.toString());
    if (until) params.append('until', until.toString());

    const response = await fetch(`/api/vercel/usage?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Vercel usage');
    }

    const data = await response.json();

    // Ensure Vercel provider exists
    let vercelProvider = await prisma.provider.findFirst({
      where: { type: 'vercel' },
    });

    if (!vercelProvider) {
      vercelProvider = await prisma.provider.create({
        data: {
          name: 'Vercel',
          type: 'vercel',
        },
      });
    }

    // Store raw billing data
    const rawBilling = await prisma.rawBilling.create({
      data: {
        providerId: vercelProvider.id,
        raw: data,
      },
    });

    return { success: true, rawBillingId: rawBilling.id, data };
  } catch (error) {
    console.error('Error syncing Vercel usage:', error);
    throw error;
  }
}

/**
 * Process raw Vercel billing data into daily costs
 */
export async function processVercelBilling(rawBillingId: number) {
  try {
    const rawBilling = await prisma.rawBilling.findUnique({
      where: { id: rawBillingId },
      include: { provider: true },
    });

    if (!rawBilling || !rawBilling.raw) {
      throw new Error('Raw billing data not found');
    }

    const data = rawBilling.raw as any;

    // Parse Vercel usage data structure (adjust based on actual API response)
    // This is a placeholder - adjust based on actual Vercel API response structure
    const dailyCosts = [];

    if (data.usage && Array.isArray(data.usage)) {
      for (const item of data.usage) {
        // Find the app by Vercel project ID if available
        const app = item.projectId
          ? await prisma.app.findFirst({
              where: { vercelProjectId: item.projectId },
            })
          : null;

        if (app && item.date && item.cost) {
          const cost = await prisma.dailyCost.upsert({
            where: {
              appId_date_providerId: {
                appId: app.id,
                date: new Date(item.date),
                providerId: rawBilling.providerId!,
              },
            },
            update: {
              costLocal: item.cost,
              currency: item.currency || 'USD',
              notes: `Synced from Vercel API`,
            },
            create: {
              appId: app.id,
              date: new Date(item.date),
              providerId: rawBilling.providerId!,
              costLocal: item.cost,
              currency: item.currency || 'USD',
              notes: `Synced from Vercel API`,
            },
          });

          dailyCosts.push(cost);
        }
      }
    }

    return { success: true, count: dailyCosts.length, costs: dailyCosts };
  } catch (error) {
    console.error('Error processing Vercel billing:', error);
    throw error;
  }
}
