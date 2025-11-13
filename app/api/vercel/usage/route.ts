import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // Unix timestamp
    const until = searchParams.get('until'); // Unix timestamp

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
    if (since) params.append('since', since);
    if (until) params.append('until', until);

    const url = `https://api.vercel.com/v1/integrations/usage?${params.toString()}`;

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
    console.error('Error fetching Vercel usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Vercel usage' },
      { status: 500 }
    );
  }
}
