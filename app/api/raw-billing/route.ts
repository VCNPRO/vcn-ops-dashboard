import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const providerId = searchParams.get('providerId');

    const where: any = {};
    if (appId) where.appId = parseInt(appId);
    if (providerId) where.providerId = parseInt(providerId);

    const rawBilling = await prisma.rawBilling.findMany({
      where,
      include: {
        app: true,
        provider: true,
      },
      orderBy: { fetchedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(rawBilling);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching raw billing' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawBilling = await prisma.rawBilling.create({
      data: body,
    });
    return NextResponse.json(rawBilling, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating raw billing' },
      { status: 500 }
    );
  }
}
