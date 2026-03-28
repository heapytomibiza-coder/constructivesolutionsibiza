import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

/** Tier ↔ commission mapping — single source of truth */
const TIER_COMMISSION: Record<string, { tier: string; commission: number }> = {
  'price_1TG3HUAsoYCrHLeBJ0XM4Ks3': { tier: 'silver', commission: 12 },
  'price_1TG3HWAsoYCrHLeBdJC0lMwF': { tier: 'gold', commission: 9 },
  'price_1TG3HXAsoYCrHLeBlwitj6fQ': { tier: 'elite', commission: 6 },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: 'Missing Stripe config' }), { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey);
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), { status: 400, headers: corsHeaders });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const userId = session.metadata?.user_id;
        if (!userId) { console.error('No user_id in metadata'); break; }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = sub.items.data[0]?.price?.id;
        const mapping = priceId ? TIER_COMMISSION[priceId] : null;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier: mapping?.tier ?? 'bronze',
          status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          commission_rate: mapping?.commission ?? 18,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        await supabase.from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (!subId) break;

        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from('subscriptions')
          .update({
            tier: 'bronze',
            status: 'cancelled',
            commission_rate: 18,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
});
