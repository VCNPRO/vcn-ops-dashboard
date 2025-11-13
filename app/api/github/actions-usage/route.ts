import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const org = searchParams.get('org');

    const token = process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'GITHUB_TOKEN not configured' },
        { status: 500 }
      );
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
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'GitHub API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching GitHub Actions usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub Actions usage' },
      { status: 500 }
    );
  }
}
