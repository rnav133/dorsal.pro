import Airtable from 'airtable'
import { Race } from '@/types'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
)

const RACES_TABLE = 'Carreras'

export async function getRaces(filters?: {
  type?: string
  province?: string
  month?: number
}): Promise<Race[]> {
  const records = await base(RACES_TABLE).select({ view: 'Grid view' }).all()

  let races: Race[] = records.map((r) => ({
    id: r.id,
    name: r.get('Nombre') as string,
    date: r.get('Fecha') as string,
    type: r.get('Tipo') as string,
    distance: r.get('Distancia') as string,
    province: r.get('Provincia') as string,
    city: r.get('Ciudad') as string,
    registerUrl: r.get('URL Inscripción') as string,
    price: r.get('Precio') as number,
    description: r.get('Descripción') as string,
    imageUrl: r.get('Imagen') as string,
    featured: r.get('Destacada') as boolean,
  }))

  if (filters?.type) {
    races = races.filter((r) => r.type === filters.type)
  }
  if (filters?.province) {
    races = races.filter((r) => r.province === filters.province)
  }
  if (filters?.month) {
    races = races.filter(
      (r) => new Date(r.date).getMonth() + 1 === filters.month
    )
  }

  return races.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export async function getRaceById(id: string): Promise<Race | null> {
  try {
    const record = await base(RACES_TABLE).find(id)
    return {
      id: record.id,
      name: record.get('Nombre') as string,
      date: record.get('Fecha') as string,
      type: record.get('Tipo') as string,
      distance: record.get('Distancia') as string,
      province: record.get('Provincia') as string,
      city: record.get('Ciudad') as string,
      registerUrl: record.get('URL Inscripción') as string,
      price: record.get('Precio') as number,
      description: record.get('Descripción') as string,
      imageUrl: record.get('Imagen') as string,
      featured: record.get('Destacada') as boolean,
    }
  } catch {
    return null
  }
}

export async function getUpcomingRacesThisWeekend(): Promise<Race[]> {
  const all = await getRaces()
  const now = new Date()
  const friday = new Date(now)
  friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7))
  friday.setHours(0, 0, 0, 0)
  const sunday = new Date(friday)
  sunday.setDate(friday.getDate() + 2)
  sunday.setHours(23, 59, 59, 999)

  return all.filter((r) => {
    const d = new Date(r.date)
    return d >= friday && d <= sunday
  })
}
