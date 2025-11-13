import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project');

    const token = process.env.VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!token) {
      return NextResponse.json(
        { error: 'VERCEL_TOKEN not configured' },
        { status: 500 }
      );
    }

    const baseUrl = 'https://api.vercel.com/v9/projects';
    const url = projectId
      ? `${baseUrl}/${projectId}${teamId ? `?teamId=${teamId}` : ''}`
      : `${baseUrl}${teamId ? `?teamId=${teamId}` : ''}`;

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
    console.error('Error fetching Vercel projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Vercel projects' },
      { status: 500 }
    );
  }
}
