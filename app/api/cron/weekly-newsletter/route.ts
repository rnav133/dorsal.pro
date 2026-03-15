import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getUpcomingRaces } from '@/lib/airtable'
import { Resend } from 'resend'
import { Race } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Vercel Cron: runs every Friday at 9:00 AM Europe/Madrid
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const races = await getUpcomingRaces(4)

  if (races.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No upcoming races' })
  }

  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('email, name')

  if (error) throw error

  const emailHtml = buildNewsletterEmail(races)

  let sent = 0
  const batch = subscribers || []
  for (let i = 0; i < batch.length; i += 50) {
    const chunk = batch.slice(i, i + 50)
    await Promise.all(
      chunk.map((sub) =>
        resend.emails.send({
          from: 'dorsal.pro <onboarding@resend.dev>',
          to: sub.email,
          subject: `🏃 ${races.length} carreras en los próximos 4 meses — dorsal.pro`,
          html: emailHtml,
        })
      )
    )
    sent += chunk.length
  }

  return NextResponse.json({ ok: true, sent, races: races.length })
}

function buildNewsletterEmail(races: Race[]) {
  // Group races by month
  const byMonth = races.reduce((acc, race) => {
    const month = new Date(race.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    if (!acc[month]) acc[month] = []
    acc[month].push(race)
    return acc
  }, {} as Record<string, Race[]>)

  const racesHtml = Object.entries(byMonth).map(([month, monthRaces]) => `
    <p style="color:#fafafa;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid #27272a;">
      ${month}
    </p>
    ${monthRaces.map((race) => {
      const date = new Date(race.date).toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
      return `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:18px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <span style="background:#22c55e20;color:#22c55e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;">${race.type}</span>
        ${race.price && race.price > 0 ? `<span style="color:#a1a1aa;font-size:12px;">${race.price} €</span>` : ''}
      </div>
      <h3 style="color:#fafafa;font-size:15px;font-weight:600;margin:0 0 6px;">${race.name}</h3>
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 2px;">📍 ${race.city}, ${race.province}</p>
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 14px;">📅 ${date}${race.distance ? ` · ${race.distance}` : ''}</p>
      ${race.registerUrl ? `<a href="${race.registerUrl}" style="display:inline-block;background:#22c55e;color:#000;font-size:12px;font-weight:700;padding:7px 18px;border-radius:8px;text-decoration:none;">Inscribirse →</a>` : ''}
    </div>`
    }).join('')}
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">DORSAL.PRO</p>
    <h1 style="color:#fafafa;font-size:22px;font-weight:700;margin:0 0 4px;">Carreras de los próximos 4 meses 🏃</h1>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;">${races.length} carrera${races.length > 1 ? 's' : ''} para planificar con tiempo</p>
    ${racesHtml}
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px;margin-top:24px;">
      <p style="color:#22c55e;font-size:13px;font-weight:600;margin:0 0 8px;">¿Ya tienes carrera? Prueba Dorsal Pro</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 12px;">Plan de entrenamiento personalizado con IA, entrenamiento del día y guía de nutrición. Todo por 4,99 €/mes.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe?plan=pro" style="color:#22c55e;font-size:13px;font-weight:600;text-decoration:none;">Saber más →</a>
    </div>
    <p style="color:#3f3f46;font-size:12px;text-align:center;margin-top:32px;">dorsal.pro · <a href="#" style="color:#3f3f46;">Cancelar suscripción</a></p>
  </div>
</body>
</html>`
}
