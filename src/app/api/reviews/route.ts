import { NextResponse } from 'next/server';
import reviewsData from '@/data/reviews.json';

export async function GET() {
  return NextResponse.json(reviewsData);
}
