import { NextResponse } from 'next/server';
import { syncVercelProjects, syncVercelUsage } from '@/lib/vercel-sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, since, until } = body;

    if (action === 'projects') {
      const result = await syncVercelProjects();
      return NextResponse.json(result);
    }

    if (action === 'usage') {
      const result = await syncVercelUsage(since, until);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "projects" or "usage"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error syncing Vercel data:', error);
    return NextResponse.json(
      { error: 'Failed to sync Vercel data' },
      { status: 500 }
    );
  }
}
