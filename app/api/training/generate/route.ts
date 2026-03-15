import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateTrainingPlan } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, raceId, raceName, raceDate, raceDistance, raceType, currentPace, availableDays, level } = body

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

    // Generate plan with Claude
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
    })

    // Save race registration
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

    // Save training plan
    const { data: plan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        subscriber_id: subscriber.id,
        race_registration_id: registration.id,
        race_name: raceName,
        race_date: raceDate,
        plan_data: { weeks },
      })
      .select('id')
      .single()

    if (planError) throw planError

    return NextResponse.json({ planId: plan.id, weeks })
  } catch (error) {
    console.error('Error generating training plan:', error)
    return NextResponse.json({ error: 'Error generando el plan' }, { status: 500 })
  }
}
