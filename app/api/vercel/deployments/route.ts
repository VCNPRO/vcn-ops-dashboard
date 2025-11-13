import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = searchParams.get('limit') || '20';

    const token = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!token) {
      return NextResponse.json(
        { error: 'VERCEL_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Build query params
    const params = new URLSearchParams();
    if (teamId) params.append('teamId', teamId);
    if (projectId) params.append('projectId', projectId);
    params.append('limit', limit);

    const url = `https://api.vercel.com/v6/deployments?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Vercel API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Vercel deployments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Vercel deployments' },
      { status: 500 }
    );
  }
}
