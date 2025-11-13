import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zoneId');

    const token = process.env.CLOUDFLARE_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'CLOUDFLARE_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    if (!zoneId) {
      return NextResponse.json(
        { error: 'zoneId parameter required' },
        { status: 400 }
      );
    }

    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.errors?.[0]?.message || 'Cloudflare API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Cloudflare analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Cloudflare analytics' },
      { status: 500 }
    );
  }
}
