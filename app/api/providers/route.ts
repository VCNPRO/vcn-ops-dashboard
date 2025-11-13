import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const providers = await prisma.provider.findMany();
    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = await prisma.provider.create({
      data: body,
    });
    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error creating provider' },
      { status: 500 }
    );
  }
}
