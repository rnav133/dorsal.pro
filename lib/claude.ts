import Anthropic from '@anthropic-ai/sdk'
import { TrainingPlan, TrainingWeek } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface GeneratePlanParams {
  subscriberId: string
  raceName: string
  raceDate: string
  raceDistance: string
  raceType: string
  currentPace: string        // ej: "5:30 min/km"
  availableDays: number      // días por semana disponibles
  level: 'principiante' | 'intermedio' | 'avanzado'
  name?: string
}

export async function generateTrainingPlan(params: GeneratePlanParams): Promise<TrainingWeek[]> {
  const weeksUntilRace = Math.max(
    1,
    Math.round((new Date(params.raceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
  )

  const prompt = `Eres un entrenador de running experto. Genera un plan de entrenamiento personalizado en JSON.

DATOS DEL CORREDOR:
- Nombre: ${params.name || 'Corredor'}
- Nivel: ${params.level}
- Ritmo actual: ${params.currentPace}
- Días disponibles por semana: ${params.availableDays}

CARRERA OBJETIVO:
- Nombre: ${params.raceName}
- Tipo: ${params.raceType}
- Distancia: ${params.raceDistance}
- Fecha: ${params.raceDate}
- Semanas hasta la carrera: ${weeksUntilRace}

Genera un plan de entrenamiento de ${weeksUntilRace} semanas. Responde ÚNICAMENTE con JSON válido con esta estructura exacta:

{
  "weeks": [
    {
      "week": 1,
      "focus": "Descripción del objetivo de la semana",
      "days": [
        {
          "day": "Lunes",
          "workout": "Descripción detallada del entrenamiento",
          "duration": "45 min",
          "distance": "8 km",
          "intensity": "baja",
          "completed": null,
          "feedback": null,
          "nutrition": {
            "preworkout": "Qué comer antes",
            "postworkout": "Qué comer después",
            "notes": "Notas adicionales de nutrición si aplica"
          }
        }
      ]
    }
  ]
}

REGLAS:
- Solo incluye días de entrenamiento (no descanso), máximo ${params.availableDays} días por semana
- La intensidad debe ser "baja", "media" o "alta"
- Semana final (última semana): reducir volumen al 60% (tapering)
- Incluir nutrición especial solo en días de entrenamiento de alta intensidad o larga distancia
- Progresión gradual de volumen (no aumentar más de 10% por semana)
- completed y feedback siempre null en el plan inicial`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed.weeks as TrainingWeek[]
}

interface AdjustPlanParams {
  remainingWeeks: TrainingWeek[]
  recentFeedback: { day: string; completed: boolean | null; feedback: string | null }[]
  raceName: string
  raceDate: string
}

export async function adjustTrainingPlan(params: AdjustPlanParams): Promise<TrainingWeek[]> {
  const prompt = `Eres un entrenador de running experto. Ajusta el plan de entrenamiento basándote en el feedback del corredor.

FEEDBACK RECIENTE:
${params.recentFeedback.map(f => `- ${f.day}: ${f.completed ? 'Completado' : 'No completado'}${f.feedback ? ` — "${f.feedback}"` : ''}`).join('\n')}

PLAN RESTANTE (en JSON):
${JSON.stringify(params.remainingWeeks, null, 2)}

Ajusta el plan restante según el feedback. Si hay lesión o dolor, reduce intensidad. Si fue muy fácil, aumenta ligeramente.
Responde ÚNICAMENTE con el JSON del plan ajustado, manteniendo la misma estructura exacta.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const jsonMatch = content.text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0]) as TrainingWeek[]
}
