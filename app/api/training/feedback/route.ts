import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { adjustTrainingPlan } from '@/lib/claude'

// Called by Resend inbound webhook when a subscriber replies to their daily email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Resend inbound format
    const fromEmail = body.from?.address || body.from
    const replyText = body.text || body.html?.replace(/<[^>]*>/g, '') || ''
    const subject = body.subject || ''

    // Extract plan ID from email subject: [plan:PLAN_ID]
    const planIdMatch = subject.match(/\[plan:([^\]]+)\]/)
    const dayMatch = subject.match(/\[day:([^\]]+)\]/)
    if (!planIdMatch || !dayMatch) {
      return NextResponse.json({ ok: true }) // ignore unrelated emails
    }

    const planId = planIdMatch[1]
    const dayKey = dayMatch[1] // e.g. "week1_lunes"

    // Fetch the plan
    const { data: plan, error } = await supabase
      .from('training_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error || !plan) return NextResponse.json({ ok: true })

    // Determine if completed based on reply text
    const lowerReply = replyText.toLowerCase()
    const completed =
      /\b(sí|si|hecho|listo|completado|lo hice|realizado|bien|perfecto|ok)\b/.test(lowerReply)
        ? true
        : /\b(no|no pude|no lo hice|imposible|cancelado|lesion|lesión|dolor)\b/.test(lowerReply)
        ? false
        : null

    // Update the specific day in plan_data
    const weeks = plan.plan_data.weeks as any[]
    const [, weekStr, dayName] = dayKey.match(/week(\d+)_(.+)/) || []
    const weekIndex = parseInt(weekStr) - 1
    if (weekIndex >= 0 && weekIndex < weeks.length) {
      const dayIndex = weeks[weekIndex].days.findIndex(
        (d: any) => d.day.toLowerCase() === dayName.toLowerCase()
      )
      if (dayIndex >= 0) {
        weeks[weekIndex].days[dayIndex].completed = completed
        weeks[weekIndex].days[dayIndex].feedback = replyText.trim().slice(0, 500)
      }
    }

    // Save updated plan
    await supabase
      .from('training_plans')
      .update({ plan_data: { weeks } })
      .eq('id', planId)

    // Check if we should adjust the remaining plan (every Sunday or after 3 negative feedbacks)
    const recentFeedback = weeks
      .flatMap((w: any) => w.days)
      .filter((d: any) => d.completed !== null)
      .slice(-7)
      .map((d: any) => ({ day: d.day, completed: d.completed, feedback: d.feedback }))

    const negativeCount = recentFeedback.filter((f) => f.completed === false).length
    const todayIsSunday = new Date().getDay() === 0

    if (negativeCount >= 3 || todayIsSunday) {
      const currentWeek = Math.ceil(
        (new Date().getTime() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24 * 7)
      )
      const remainingWeeks = weeks.slice(currentWeek)
      if (remainingWeeks.length > 0) {
        const adjusted = await adjustTrainingPlan({
          remainingWeeks,
          recentFeedback,
          raceName: plan.race_name,
          raceDate: plan.race_date,
        })
        const updatedWeeks = [...weeks.slice(0, currentWeek), ...adjusted]
        await supabase
          .from('training_plans')
          .update({ plan_data: { weeks: updatedWeeks } })
          .eq('id', planId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Feedback webhook error:', error)
    return NextResponse.json({ error: 'Error processing feedback' }, { status: 500 })
  }
}
