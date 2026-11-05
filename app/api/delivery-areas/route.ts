import { NextResponse } from 'next/server';
import deliveryAreasData from '@/data/delivery-areas.json';

export async function GET() {
  return NextResponse.json(deliveryAreasData.filter((a) => a.isActive));
}
