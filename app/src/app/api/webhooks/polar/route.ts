import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUserPlan, updateUserPolarId } from '@/lib/db';
import crypto from 'crypto';

// Polar webhook: uppdatera plan vid köp/avslut
// Polar använder Standard Webhooks-format (webhook-id, webhook-timestamp, webhook-signature)

function verifyStandardWebhook(body: string, headers: Headers, secret: string): boolean {
  try {
    const webhookId = headers.get('webhook-id');
    const webhookTimestamp = headers.get('webhook-timestamp');
    const webhookSignature = headers.get('webhook-signature');

    if (!webhookId || !webhookTimestamp || !webhookSignature) return false;

    // Polar secret: "polar_whs_..." — base64-del är efter "polar_whs_"
    // Standard Webhooks: "whsec_..." — base64-del är efter "whsec_"
    const rawSecret = secret.replace(/^polar_whs_/, '').replace(/^whsec_/, '');
    const secretBytes = Buffer.from(rawSecret, 'base64');
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

    // webhook-signature kan ha flera signaturer separerade med space, format: "v1,<base64>"
    const signatures = webhookSignature.split(' ');
    for (const sig of signatures) {
      const sigValue = sig.split(',')[1];
      if (sigValue && sigValue === expected) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function mapProductToPlan(productName: string, priceAmount: number): string {
  const name = productName.toLowerCase();
  if (name.includes('team')) return 'team';
  if (name.includes('pro')) return 'pro';
  if (priceAmount >= 4900) return 'team';
  if (priceAmount >= 1900) return 'pro';
  return 'free';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const secret = process.env.POLAR_WEBHOOK_SECRET;

    if (secret) {
      if (!verifyStandardWebhook(body, req.headers, secret)) {
        console.error('Polar webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('Polar webhook: POLAR_WEBHOOK_SECRET not set, skipping signature verification');
    }

    const event = JSON.parse(body);
    const type = event.type as string;

    console.log(`Polar webhook: ${type}`);

    if (type === 'order.created' || type === 'checkout.created') {
      const data = event.data;
      const email = data.customer?.email;
      const productName = data.product?.name || '';
      const priceAmount = data.product_price?.price_amount || data.amount || 0;

      if (!email) {
        console.error('Polar webhook: no customer email in payload');
        return NextResponse.json({ error: 'No customer email' }, { status: 400 });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        console.error(`Polar webhook: no user for ${email}`);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const plan = mapProductToPlan(productName, priceAmount);
      await updateUserPlan(user.id as string, plan);

      if (data.customer_id) {
        await updateUserPolarId(user.id as string, data.customer_id);
      }

      console.log(`Polar webhook: upgraded ${email} to ${plan}`);

    } else if (type === 'subscription.canceled' || type === 'subscription.revoked') {
      const data = event.data;
      const email = data.customer?.email;

      if (email) {
        const user = await getUserByEmail(email);
        if (user) {
          await updateUserPlan(user.id as string, 'free');
          console.log(`Polar webhook: downgraded ${email} to free`);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Polar webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
