import { NextRequest, NextResponse } from 'next/server'
import { getRaces } from '@/lib/airtable'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || undefined
  const province = searchParams.get('province') || undefined
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined

  try {
    const races = await getRaces({ type, province, month })
    return NextResponse.json(races)
  } catch (error) {
    console.error('Error fetching races from Airtable:', error)
    return NextResponse.json({ error: 'Error al cargar carreras' }, { status: 500 })
  }
}
