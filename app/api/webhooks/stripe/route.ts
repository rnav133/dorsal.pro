import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
      const email = customer.email
      if (email) {
        await supabase
          .from('subscribers')
          .update({
            plan: sub.status === 'active' ? 'pro' : 'free',
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
          })
          .eq('email', email)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
      const email = customer.email
      if (email) {
        await supabase
          .from('subscribers')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('email', email)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
