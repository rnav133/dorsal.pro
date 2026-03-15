import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Vercel Cron: runs every day at 7:00 AM Europe/Madrid
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const todayName = today.toLocaleDateString('es-ES', { weekday: 'long' })
    .charAt(0).toUpperCase() + today.toLocaleDateString('es-ES', { weekday: 'long' }).slice(1)

  // Get all active training plans
  const { data: plans, error } = await supabase
    .from('training_plans')
    .select(`
      id, race_name, race_date, plan_data, created_at,
      subscribers (id, email, name)
    `)
    .gte('race_date', today.toISOString().split('T')[0])

  if (error) throw error

  let sent = 0
  for (const plan of plans || []) {
    const subscriber = Array.isArray(plan.subscribers) ? plan.subscribers[0] : plan.subscribers
    if (!subscriber?.email) continue

    // Find today's workout
    const weekNumber = Math.ceil(
      (today.getTime() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)
    )
    const weeks = plan.plan_data?.weeks || []
    const currentWeek = weeks[weekNumber - 1]
    if (!currentWeek) continue

    const todayWorkout = currentWeek.days?.find(
      (d: any) => d.day.toLowerCase() === todayName.toLowerCase()
    )
    if (!todayWorkout) continue // rest day

    const dayKey = `week${weekNumber}_${todayName.toLowerCase()}`
    const subject = `Tu entreno de hoy — ${plan.race_name} [plan:${plan.id}] [day:${dayKey}]`

    const emailHtml = buildWorkoutEmail({
      name: subscriber.name || 'Corredor',
      workout: todayWorkout,
      weekFocus: currentWeek.focus,
      weekNumber,
      raceName: plan.race_name,
      raceDate: plan.race_date,
    })

    await resend.emails.send({
      from: 'dorsal.pro <entrena@dorsal.pro>',
      to: subscriber.email,
      replyTo: 'entrena@dorsal.pro',
      subject,
      html: emailHtml,
    })
    sent++
  }

  return NextResponse.json({ ok: true, sent })
}

function buildWorkoutEmail(params: {
  name: string
  workout: any
  weekFocus: string
  weekNumber: number
  raceName: string
  raceDate: string
}) {
  const { name, workout, weekFocus, weekNumber, raceName, raceDate } = params
  const intensityColor = workout.intensity === 'alta' ? '#22c55e' : workout.intensity === 'media' ? '#eab308' : '#a1a1aa'
  const raceFormatted = new Date(raceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">DORSAL.PRO</p>
    <h1 style="color:#fafafa;font-size:24px;font-weight:700;margin:0 0 4px;">Hola ${name} 👋</h1>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 32px;">Semana ${weekNumber} · ${raceName} el ${raceFormatted}</p>

    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">OBJETIVO DE HOY</p>
      <p style="color:#fafafa;font-size:18px;font-weight:600;margin:0 0 16px;">${workout.workout}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        ${workout.duration ? `<span style="background:#27272a;color:#a1a1aa;font-size:12px;padding:4px 12px;border-radius:20px;">⏱ ${workout.duration}</span>` : ''}
        ${workout.distance ? `<span style="background:#27272a;color:#a1a1aa;font-size:12px;padding:4px 12px;border-radius:20px;">📏 ${workout.distance}</span>` : ''}
        <span style="background:#27272a;color:${intensityColor};font-size:12px;padding:4px 12px;border-radius:20px;">Intensidad ${workout.intensity}</span>
      </div>
    </div>

    ${workout.nutrition ? `
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="color:#a1a1aa;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px;">NUTRICIÓN</p>
      ${workout.nutrition.preworkout ? `<p style="color:#fafafa;font-size:13px;margin:0 0 8px;"><strong style="color:#22c55e;">Antes:</strong> ${workout.nutrition.preworkout}</p>` : ''}
      ${workout.nutrition.postworkout ? `<p style="color:#fafafa;font-size:13px;margin:0 0 8px;"><strong style="color:#22c55e;">Después:</strong> ${workout.nutrition.postworkout}</p>` : ''}
      ${workout.nutrition.notes ? `<p style="color:#a1a1aa;font-size:12px;margin:0;">${workout.nutrition.notes}</p>` : ''}
    </div>
    ` : ''}

    <div style="background:#22c55e10;border:1px solid #22c55e30;border-radius:12px;padding:20px;margin-bottom:32px;">
      <p style="color:#22c55e;font-size:14px;font-weight:600;margin:0 0 8px;">¿Lo has completado?</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0;">Responde a este email con un simple <strong style="color:#fafafa;">sí</strong> o <strong style="color:#fafafa;">no</strong> — o cuéntanos cómo fue. Tu plan se ajustará automáticamente.</p>
    </div>

    <p style="color:#3f3f46;font-size:12px;text-align:center;margin:0;">dorsal.pro · <a href="#" style="color:#3f3f46;">Cancelar suscripción</a></p>
  </div>
</body>
</html>`
}
