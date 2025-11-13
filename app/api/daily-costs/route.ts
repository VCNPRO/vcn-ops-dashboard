import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (appId) where.appId = parseInt(appId);
    if (startDate) where.date = { gte: new Date(startDate) };
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }

    const dailyCosts = await prisma.dailyCost.findMany({
      where,
      include: {
        app: true,
        provider: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(dailyCosts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching daily costs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dailyCost = await prisma.dailyCost.create({
      data: {
        ...body,
        date: new Date(body.date),
      },
    });
    return NextResponse.json(dailyCost, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating daily cost' },
      { status: 500 }
    );
  }
}
