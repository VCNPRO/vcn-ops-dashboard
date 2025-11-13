import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const apps = await prisma.app.findMany({
      include: {
        dailyCosts: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });
    return NextResponse.json(apps);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching apps' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const app = await prisma.app.create({
      data: body,
    });
    return NextResponse.json(app, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating app' },
      { status: 500 }
    );
  }
}
