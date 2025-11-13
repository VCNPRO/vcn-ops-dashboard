import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const resourceType = searchParams.get('resourceType');

    const where: any = {};
    if (providerId) where.providerId = parseInt(providerId);
    if (resourceType) where.resourceType = resourceType;

    const rates = await prisma.pricingRate.findMany({
      where,
      include: {
        provider: true,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching pricing rates:', error);
    return NextResponse.json(
      { error: 'Error fetching pricing rates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rate = await prisma.pricingRate.create({
      data: {
        providerId: body.providerId,
        resourceType: body.resourceType,
        unitPrice: body.unitPrice,
        currency: body.currency || 'USD',
        unit: body.unit,
        effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
        notes: body.notes,
      },
      include: {
        provider: true,
      },
    });

    return NextResponse.json(rate, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing rate:', error);
    return NextResponse.json(
      { error: 'Error creating pricing rate' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Rate ID is required' },
        { status: 400 }
      );
    }

    const rate = await prisma.pricingRate.update({
      where: { id },
      data: {
        ...data,
        effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      },
      include: {
        provider: true,
      },
    });

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Error updating pricing rate:', error);
    return NextResponse.json(
      { error: 'Error updating pricing rate' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Rate ID is required' },
        { status: 400 }
      );
    }

    await prisma.pricingRate.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing rate:', error);
    return NextResponse.json(
      { error: 'Error deleting pricing rate' },
      { status: 500 }
    );
  }
}
