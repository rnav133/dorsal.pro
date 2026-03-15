import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const { error } = await supabase.from('subscribers').upsert(
      { email: email.toLowerCase().trim(), name: name?.trim() || null, plan: 'free' },
      { onConflict: 'email' }
    )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: 'Error al suscribirse' }, { status: 500 })
  }
}
