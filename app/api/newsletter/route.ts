import { NextRequest, NextResponse } from 'next/server';
import type { NewsletterSubscriptionPayload } from '@/lib/api/types';

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as NewsletterSubscriptionPayload;
  if (!payload.email || !payload.email.includes('@')) {
    return NextResponse.json(
      { ok: false, message: 'Please enter a valid email address.' },
      { status: 400 }
    );
  }
  return NextResponse.json({
    ok: true,
    message: "You're on the list! Watch your inbox for Gee's Burger updates.",
  });
}
