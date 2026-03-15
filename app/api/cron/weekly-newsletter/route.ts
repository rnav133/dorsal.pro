import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUpcomingRacesThisWeekend } from '@/lib/airtable'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Vercel Cron: runs every Friday at 9:00 AM Europe/Madrid
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const races = await getUpcomingRacesThisWeekend()

  if (races.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No races this weekend' })
  }

  // Get all free subscribers
  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('email, name')

  if (error) throw error

  const emailHtml = buildNewsletterEmail(races)

  let sent = 0
  // Send in batches of 50
  const batch = subscribers || []
  for (let i = 0; i < batch.length; i += 50) {
    const chunk = batch.slice(i, i + 50)
    await Promise.all(
      chunk.map((sub) =>
        resend.emails.send({
          from: 'dorsal.pro <hola@dorsal.pro>',
          to: sub.email,
          subject: `🏃 ${races.length} carrera${races.length > 1 ? 's' : ''} este fin de semana`,
          html: emailHtml,
        })
      )
    )
    sent += chunk.length
  }

  return NextResponse.json({ ok: true, sent, races: races.length })
}

function buildNewsletterEmail(races: any[]) {
  const racesHtml = races.map((race) => {
    const date = new Date(race.date).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    return `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span style="background:#22c55e20;color:#22c55e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${race.type}</span>
        ${race.price > 0 ? `<span style="color:#a1a1aa;font-size:12px;">${race.price} €</span>` : ''}
      </div>
      <h3 style="color:#fafafa;font-size:16px;font-weight:600;margin:0 0 8px;">${race.name}</h3>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 4px;">📍 ${race.city}, ${race.province}</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 16px;">📅 ${date}</p>
      ${race.registerUrl ? `<a href="${race.registerUrl}" style="display:inline-block;background:#22c55e;color:#000;font-size:13px;font-weight:700;padding:8px 20px;border-radius:8px;text-decoration:none;">Inscribirse →</a>` : ''}
    </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">DORSAL.PRO</p>
    <h1 style="color:#fafafa;font-size:24px;font-weight:700;margin:0 0 4px;">Carreras este fin de semana 🏃</h1>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 32px;">${races.length} carrera${races.length > 1 ? 's' : ''} seleccionada${races.length > 1 ? 's' : ''} para ti</p>
    ${racesHtml}
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-top:24px;">
      <p style="color:#22c55e;font-size:13px;font-weight:600;margin:0 0 8px;">¿Ya tienes carrera? Prueba Dorsal Pro</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 12px;">Plan de entrenamiento con IA, entrenamiento del día y guía de nutrición por 4,99 €/mes.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe?plan=pro" style="color:#22c55e;font-size:13px;font-weight:600;text-decoration:none;">Saber más →</a>
    </div>
    <p style="color:#3f3f46;font-size:12px;text-align:center;margin-top:32px;">dorsal.pro · <a href="#" style="color:#3f3f46;">Cancelar suscripción</a></p>
  </div>
</body>
</html>`
}
