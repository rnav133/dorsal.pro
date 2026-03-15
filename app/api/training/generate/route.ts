import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateTrainingPlan } from '@/lib/claude'
import { Resend } from 'resend'
import { TrainingWeek } from '@/types'

export const maxDuration = 120

const resend = new Resend(process.env.RESEND_API_KEY)

export async function DELETE(req: NextRequest) {
  try {
    const { email, raceId } = await req.json()
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()
    if (!subscriber) return NextResponse.json({ ok: true })

    const { data: registration } = await supabase
      .from('race_registrations')
      .select('id')
      .eq('subscriber_id', subscriber.id)
      .eq('race_id', raceId)
      .single()
    if (!registration) return NextResponse.json({ ok: true })

    await supabase.from('training_plans').delete().eq('race_registration_id', registration.id)
    await supabase.from('race_registrations').delete().eq('id', registration.id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete plan error:', error)
    return NextResponse.json({ error: 'Error eliminando el plan' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, raceId, raceName, raceDate, raceDistance, raceType,
      currentPace, availableDays, level,
      injuries, recentRaceResults, vo2max, weeklyKm, strengthDays, equipment, extraInfo,
    } = body

    // Verify subscriber exists and is Pro
    const { data: subscriber, error: subError } = await supabase
      .from('subscribers')
      .select('id, name, plan')
      .eq('email', email.toLowerCase())
      .single()

    if (subError || !subscriber) {
      return NextResponse.json({ error: 'Suscriptor no encontrado' }, { status: 404 })
    }
    if (subscriber.plan !== 'pro') {
      return NextResponse.json({ error: 'Se requiere Dorsal Pro' }, { status: 403 })
    }

    // Check if a plan already exists for this race
    const { data: existingRegistration } = await supabase
      .from('race_registrations')
      .select('id')
      .eq('subscriber_id', subscriber.id)
      .eq('race_id', raceId)
      .single()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Ya tienes un plan para esta carrera', code: 'PLAN_EXISTS' },
        { status: 409 }
      )
    }

    // Save race registration immediately
    const { data: registration, error: regError } = await supabase
      .from('race_registrations')
      .insert({
        subscriber_id: subscriber.id,
        race_id: raceId,
        race_name: raceName,
        race_date: raceDate,
      })
      .select('id')
      .single()

    if (regError) throw regError

    // Generate plan and send email in background — respond immediately
    after(async () => {
      try {
        const weeks = await generateTrainingPlan({
          subscriberId: subscriber.id,
          raceName,
          raceDate,
          raceDistance,
          raceType,
          currentPace,
          availableDays: Number(availableDays),
          level,
          name: subscriber.name,
          injuries,
          recentRaceResults,
          vo2max,
          weeklyKm,
          strengthDays,
          equipment,
          extraInfo,
        })

        await supabase.from('training_plans').insert({
          subscriber_id: subscriber.id,
          race_registration_id: registration.id,
          race_name: raceName,
          race_date: raceDate,
          plan_data: { weeks },
        })

        await resend.emails.send({
          from: 'dorsal.pro <onboarding@resend.dev>',
          to: email.toLowerCase(),
          subject: `Tu plan de entrenamiento para ${raceName} 🏃`,
          html: buildPlanEmail(subscriber.name, raceName, raceDate, weeks),
        })
      } catch (err) {
        console.error('Background plan generation error:', err)
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error generating training plan:', error)
    return NextResponse.json({ error: 'Error generando el plan' }, { status: 500 })
  }
}

function buildPlanEmail(name: string | null, raceName: string, raceDate: string, weeks: TrainingWeek[]) {
  const greeting = name ? `Hola ${name}` : 'Hola'
  const raceDateFormatted = new Date(raceDate).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const weeksHtml = weeks.map((week) => `
    <div style="margin-bottom:24px;">
      <p style="color:#22c55e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 4px;">
        Semana ${week.week}
      </p>
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 12px;">${(week as any).focus || ''}</p>
      ${week.days.map((day) => {
        const intensityColor = day.intensity === 'alta' ? '#22c55e' : day.intensity === 'media' ? '#eab308' : '#a1a1aa'
        return `
        <div style="background:#18181b;border:1px solid #27272a;border-radius:8px;padding:14px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="color:#fafafa;font-size:13px;font-weight:600;">${day.day}</span>
            <span style="color:${intensityColor};font-size:11px;">${day.intensity}</span>
          </div>
          <p style="color:#a1a1aa;font-size:13px;margin:0 0 6px;">${day.workout}</p>
          <div style="display:flex;gap:12px;">
            ${day.duration ? `<span style="color:#52525b;font-size:11px;">⏱ ${day.duration}</span>` : ''}
            ${(day as any).distance ? `<span style="color:#52525b;font-size:11px;">📏 ${(day as any).distance}</span>` : ''}
            ${(day as any).pace ? `<span style="color:#52525b;font-size:11px;">🏃 ${(day as any).pace}</span>` : ''}
          </div>
          ${day.nutrition ? `
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid #27272a;">
            ${day.nutrition.preworkout ? `<p style="color:#52525b;font-size:11px;margin:0 0 3px;"><strong style="color:#a1a1aa;">Antes:</strong> ${day.nutrition.preworkout}</p>` : ''}
            ${day.nutrition.postworkout ? `<p style="color:#52525b;font-size:11px;margin:0;"><strong style="color:#a1a1aa;">Después:</strong> ${day.nutrition.postworkout}</p>` : ''}
          </div>` : ''}
        </div>`
      }).join('')}
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <p style="color:#22c55e;font-size:14px;font-weight:700;letter-spacing:0.1em;margin:0 0 8px;">DORSAL.PRO</p>
    <h1 style="color:#fafafa;font-size:22px;font-weight:700;margin:0 0 4px;">${greeting} 💪</h1>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 4px;">Tu plan de entrenamiento para:</p>
    <p style="color:#fafafa;font-size:18px;font-weight:700;margin:0 0 4px;">${raceName}</p>
    <p style="color:#a1a1aa;font-size:13px;margin:0 0 32px;">📅 ${raceDateFormatted}</p>
    <div style="background:#22c55e10;border:1px solid #22c55e30;border-radius:12px;padding:16px;margin-bottom:32px;">
      <p style="color:#22c55e;font-size:13px;font-weight:600;margin:0 0 4px;">¿Cómo funciona?</p>
      <p style="color:#a1a1aa;font-size:13px;margin:0;">Cada mañana recibirás el entrenamiento del día. Responde con <strong style="color:#fafafa;">sí</strong> si lo completaste o <strong style="color:#fafafa;">no</strong> si no pudiste — tu plan se ajustará automáticamente.</p>
    </div>
    ${weeksHtml}
    <p style="color:#3f3f46;font-size:12px;text-align:center;margin-top:32px;">dorsal.pro · Tu entrenador personal</p>
  </div>
</body>
</html>`
}
