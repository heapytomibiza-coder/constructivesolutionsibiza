import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const PRICE_IDS: Record<string, string> = {
  silver: 'price_1TG3HUAsoYCrHLeBJ0XM4Ks3',
  gold: 'price_1TG3HWAsoYCrHLeBdJC0lMwF',
  elite: 'price_1TG3HXAsoYCrHLeBlwitj6fQ',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: authError } = await supabase.auth.getClaims(token);
  if (authError || !claims?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const userId = claims.claims.sub as string;
  const userEmail = claims.claims.email as string;

  // Parse + validate body
  let body: { tier?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders });
  }

  const tier = body.tier;
  if (!tier || !PRICE_IDS[tier]) {
    return new Response(JSON.stringify({ error: 'Invalid tier. Must be silver, gold, or elite.' }), { status: 400, headers: corsHeaders });
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey);

  // Check for existing Stripe customer
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
  }

  // Determine success/cancel URLs
  const origin = req.headers.get('origin') || 'https://constructivesolutionsibiza.lovable.app';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
    success_url: `${origin}/professional/dashboard?subscription=success`,
    cancel_url: `${origin}/pricing?subscription=cancelled`,
    metadata: { user_id: userId },
  });

  return new Response(
    JSON.stringify({ url: session.url }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
