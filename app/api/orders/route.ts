import { NextRequest, NextResponse } from 'next/server';
import catalogData from '@/data/catalog.json';
import deliveryAreasData from '@/data/delivery-areas.json';
import type { GeesCatalog } from '@/types/catalog';
import type { DeliveryArea, OrderSubmissionPayload } from '@/lib/api/types';
import { buildWhatsAppOrderMessage } from '@/lib/catalog-helpers';

export async function POST(req: NextRequest) {
  const payload = (await req.json()) as OrderSubmissionPayload;
  const built = buildWhatsAppOrderMessage(
    catalogData as GeesCatalog,
    deliveryAreasData as DeliveryArea[],
    payload
  );
  return NextResponse.json({
    orderId: payload.orderId,
    whatsappUrl: built.whatsappUrl,
    messagePreview: built.messagePreview,
    subtotal: built.subtotal,
    deliveryFee: built.deliveryFee,
    total: built.total,
  });
}
