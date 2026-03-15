import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import Stripe from 'stripe'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
      const email = customer.email
      if (email && sub.status === 'active') {
        await supabase
          .from('subscribers')
          .update({ plan: 'pro', stripe_customer_id: customerId, stripe_subscription_id: sub.id })
          .eq('email', email)

        const { data: subscriber } = await supabase
          .from('subscribers')
          .select('name')
          .eq('email', email)
          .single()

        await resend.emails.send({
          from: 'dorsal.pro <onboarding@resend.dev>',
          to: email,
          subject: '¡Bienvenido a Dorsal Pro! 🎉',
          html: buildProConfirmationEmail(subscriber?.name || null),
        })
      }
      break
    }
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

        await resend.emails.send({
          from: 'dorsal.pro <onboarding@resend.dev>',
          to: email,
          subject: 'Has cancelado Dorsal Pro',
          html: buildCancellationEmail(),
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

function buildProConfirmationEmail(name: string | null) {
  const greeting = name ? `Hola ${name}` : 'Hola'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">DORSAL.PRO</p>
    <h1 style="color:#fafafa;font-size:24px;font-weight:700;margin:0 0 8px;">${greeting} 🎉</h1>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Tu suscripción a <strong style="color:#fafafa;">Dorsal Pro</strong> está activa. Ya puedes generar tu plan de entrenamiento personalizado.
    </p>

    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px;">Lo que incluye tu plan</p>
      ${[
        'Plan de entrenamiento personalizado semana a semana',
        'Entrenamiento del día cada mañana por email',
        'El plan se adapta según tu feedback',
        'Guía de nutrición para días de entreno intenso',
      ].map(f => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="color:#22c55e;font-weight:700;">✓</span>
        <span style="color:#fafafa;font-size:14px;">${f}</span>
      </div>`).join('')}
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/pro/generar-plan"
       style="display:inline-block;background:#22c55e;color:#000;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
      Generar mi plan de entrenamiento →
    </a>

    <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 24px;">
      Tu suscripción se renueva automáticamente cada mes por <strong style="color:#fafafa;">4,99 €</strong>.
      Puedes cancelar cuando quieras desde el portal de gestión.
    </p>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/portal"
       style="color:#a1a1aa;font-size:12px;text-decoration:none;">
      Gestionar suscripción →
    </a>

    <p style="color:#3f3f46;font-size:12px;margin-top:32px;">dorsal.pro</p>
  </div>
</body>
</html>`
}

function buildCancellationEmail() {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">DORSAL.PRO</p>
    <h1 style="color:#fafafa;font-size:22px;font-weight:700;margin:0 0 8px;">Has cancelado Dorsal Pro</h1>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Tu suscripción ha sido cancelada. Mantienes acceso a Dorsal Pro hasta el final del período actual.
    </p>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;">
      Seguirás recibiendo la newsletter semanal gratuita con las carreras de los próximos meses.
    </p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe?plan=pro"
       style="display:inline-block;background:#22c55e;color:#000;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;">
      Volver a activar Dorsal Pro →
    </a>
    <p style="color:#3f3f46;font-size:12px;margin-top:32px;">dorsal.pro</p>
  </div>
</body>
</html>`
}
