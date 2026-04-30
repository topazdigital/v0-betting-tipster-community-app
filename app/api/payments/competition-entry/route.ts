import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface PaymentBody {
  method: 'mpesa' | 'card' | 'wallet';
  amount: number;
  currency: string;
  competitionName: string;
  phone?: string;
  cardLast4?: string;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Sign in required.' }, { status: 401 });
  }

  let body: PaymentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!body.method || !body.amount || body.amount <= 0) {
    return NextResponse.json({ success: false, error: 'Method and a positive amount are required.' }, { status: 400 });
  }

  // Generate a deterministic-ish reference. In production this would be the
  // M-Pesa CheckoutRequestID / Stripe PaymentIntent / wallet ledger id.
  const reference = `${body.method.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // For now we record the intent and immediately return success. When a real
  // gateway (Daraja / Stripe) is configured the route should:
  //   1. Initiate STK push / PaymentIntent
  //   2. Return an `awaiting_callback` state and a polling URL
  //   3. Mark `paid` only after webhook confirmation
  return NextResponse.json({
    success: true,
    reference,
    method: body.method,
    amount: body.amount,
    currency: body.currency,
    competitionName: body.competitionName,
    paidAt: new Date().toISOString(),
  });
}
