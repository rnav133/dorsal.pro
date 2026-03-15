import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanName = name?.trim() || null

    const { error } = await supabase.from('subscribers').upsert(
      { email: cleanEmail, name: cleanName, plan: 'free' },
      { onConflict: 'email' }
    )

    if (error) throw error

    // Send confirmation email
    await resend.emails.send({
      from: 'dorsal.pro <onboarding@resend.dev>',
      to: cleanEmail,
      subject: '¡Bienvenido a dorsal.pro! 🏃',
      html: buildConfirmationEmail(cleanName),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Error al suscribirse' }, { status: 500 })
  }
}

function buildConfirmationEmail(name: string | null) {
  const greeting = name ? `Hola ${name}` : 'Hola'
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 24px;">DORSAL.PRO</p>

    <h1 style="color:#fafafa;font-size:24px;font-weight:700;margin:0 0 8px;">${greeting} 👋</h1>
    <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Ya eres parte de <strong style="color:#fafafa;">dorsal.pro</strong>. Cada viernes recibirás en este correo las carreras del fin de semana en España — nombre, fecha, lugar y enlace de inscripción.
    </p>

    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px;">Lo que recibirás</p>
      ${[
        'Carreras del fin de semana cada viernes',
        'Filtradas por tipo: 5K, 10K, media, maratón, Hyrox...',
        'Con enlace directo de inscripción',
      ].map(f => `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span style="color:#22c55e;font-weight:700;">✓</span>
        <span style="color:#fafafa;font-size:14px;">${f}</span>
      </div>`).join('')}
    </div>

    <div style="background:#22c55e10;border:1px solid #22c55e30;border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="color:#22c55e;font-size:13px;font-weight:600;margin:0 0 6px;">¿Quieres más? Prueba Dorsal Pro</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 12px;">Plan de entrenamiento personalizado con IA, entrenamiento del día y guía de nutrición. Todo por 4,99 €/mes.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe?plan=pro" style="color:#22c55e;font-size:13px;font-weight:700;text-decoration:none;">Saber más →</a>
    </div>

    <a href="${process.env.NEXT_PUBLIC_APP_URL}/races" style="display:inline-block;background:#22c55e;color:#000;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;text-decoration:none;">
      Ver carreras próximas →
    </a>

    <p style="color:#3f3f46;font-size:12px;margin-top:32px;">dorsal.pro · <a href="#" style="color:#3f3f46;">Cancelar suscripción</a></p>
  </div>
</body>
</html>`
}
