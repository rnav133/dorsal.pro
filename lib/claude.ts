import Anthropic from '@anthropic-ai/sdk'
import { TrainingWeek } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface GeneratePlanParams {
  subscriberId: string
  raceName: string
  raceDate: string
  raceDistance: string
  raceType: string
  currentPace: string
  availableDays: number
  level: 'principiante' | 'intermedio' | 'avanzado'
  name?: string
  // Optional enrichment fields
  injuries?: string
  recentRaceResults?: string
  vo2max?: string
  weeklyKm?: string
  strengthDays?: string
  equipment?: string[]
  extraInfo?: string
}

export async function generateTrainingPlan(params: GeneratePlanParams): Promise<TrainingWeek[]> {
  const weeksUntilRace = Math.max(
    1,
    Math.round((new Date(params.raceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7))
  )

  const strengthDays = Number(params.strengthDays || 0)
  const totalDays = params.availableDays
  const runDays = Math.max(1, totalDays - strengthDays)

  const optionalData = [
    params.vo2max ? `- VO2max: ${params.vo2max} ml/kg/min` : '',
    params.weeklyKm ? `- Kilómetros semanales actuales: ${params.weeklyKm} km` : '',
    params.recentRaceResults ? `- Resultados recientes: ${params.recentRaceResults}` : '',
    params.injuries ? `- Lesiones / molestias: ${params.injuries}` : '',
    params.equipment?.length ? `- Material de fuerza disponible: ${params.equipment.join(', ')}` : '',
    params.extraInfo ? `- Info adicional: ${params.extraInfo}` : '',
  ].filter(Boolean).join('\n')

  const prompt = `Eres un entrenador de running y preparación física experto. Genera un plan de entrenamiento personalizado en JSON.

DATOS DEL CORREDOR:
- Nombre: ${params.name || 'Corredor'}
- Nivel: ${params.level}
- Ritmo actual de rodaje suave: ${params.currentPace}
- Días totales disponibles por semana: ${totalDays} (${runDays} de running + ${strengthDays} de fuerza)
${optionalData}

CARRERA OBJETIVO:
- Nombre: ${params.raceName}
- Tipo: ${params.raceType}
- Distancia: ${params.raceDistance}
- Fecha: ${params.raceDate}
- Semanas hasta la carrera: ${weeksUntilRace}

Genera un plan completo de ${weeksUntilRace} semanas. Responde ÚNICAMENTE con JSON válido con esta estructura:

{
  "weeks": [
    {
      "week": 1,
      "focus": "Descripción del objetivo de la semana",
      "days": [
        {
          "day": "Lunes",
          "type": "running",
          "workout": "Descripción detallada del entrenamiento",
          "duration": "45 min",
          "distance": "8 km",
          "pace": "5:45-6:00 min/km",
          "intensity": "baja",
          "completed": null,
          "feedback": null,
          "nutrition": {
            "preworkout": "Qué comer antes",
            "postworkout": "Qué comer después",
            "notes": "Notas adicionales"
          }
        }
      ]
    }
  ]
}

REGLAS OBLIGATORIAS:
- Máximo ${totalDays} días por semana (${runDays} running + ${strengthDays} fuerza)
- El campo "type" debe ser "running" o "strength"
- El campo "pace" es OBLIGATORIO en días de running — indica el ritmo exacto en min/km para ese entrenamiento (ej: "5:20-5:30 min/km" para tempo, "6:00-6:20 min/km" para rodaje suave). Calcula los ritmos en función del ritmo actual del corredor y la intensidad del día
- En días de fuerza: describe los ejercicios adaptados al material disponible (${params.equipment?.join(', ') || 'peso corporal'}), series y repeticiones. El campo "pace" puede ser null en días de fuerza
- La intensidad debe ser "baja", "media" o "alta"
- ${params.injuries ? `LESIONES: el corredor tiene "${params.injuries}" — adapta los ejercicios y ritmos para evitar agravar la lesión` : 'Sin lesiones conocidas'}
- Progresión gradual de volumen (máximo +10% por semana)
- Última semana: tapering — reducir volumen al 50-60%
- Incluir nutrición solo en días de alta intensidad o larga distancia
- completed y feedback siempre null
- ${params.vo2max ? `Usa el VO2max de ${params.vo2max} para calcular zonas de ritmo más precisas` : ''}
- ${params.weeklyKm ? `El corredor ya hace ${params.weeklyKm} km semanales — parte de ese volumen como base` : ''}`

  // For long plans cap at 12 weeks to keep JSON manageable
  const cappedWeeks = Math.min(weeksUntilRace, 12)

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt.replace(
      `${weeksUntilRace} semanas`,
      `${cappedWeeks} semanas`
    ).replace(
      `de ${weeksUntilRace} semanas`,
      `de ${cappedWeeks} semanas`
    )}],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  // Extract JSON — handle potentially truncated responses
  const jsonMatch = content.text.match(/\{[\s\S]*/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  let jsonStr = jsonMatch[0]
  // Try to parse; if it fails due to truncation, close open structures
  try {
    const parsed = JSON.parse(jsonStr)
    return parsed.weeks as TrainingWeek[]
  } catch {
    // Close any unclosed JSON structures
    const openBraces = (jsonStr.match(/\{/g) || []).length - (jsonStr.match(/\}/g) || []).length
    const openBrackets = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length
    jsonStr += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces))
    const parsed = JSON.parse(jsonStr)
    return parsed.weeks as TrainingWeek[]
  }
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

Ajusta el plan restante según el feedback. Si hay lesión o dolor, reduce intensidad y adapta ejercicios. Si fue muy fácil, aumenta ligeramente la carga. Mantén siempre los ritmos exactos en el campo "pace".
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
