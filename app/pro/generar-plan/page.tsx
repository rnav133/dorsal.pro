'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Race } from '@/types'

function GenerarPlanForm() {
  const searchParams = useSearchParams()
  const preselectedRaceId = searchParams.get('raceId')

  const [races, setRaces] = useState<Race[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    email: '',
    raceId: preselectedRaceId || '',
    currentPace: '',
    availableDays: '3',
    level: 'intermedio' as 'principiante' | 'intermedio' | 'avanzado',
  })

  useEffect(() => {
    fetch('/api/races')
      .then((r) => r.json())
      .then((data) => setRaces(data.filter((r: Race) => r.name && r.date)))
  }, [])

  const selectedRace = races.find((r) => r.id === form.raceId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.raceId || !form.currentPace) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/training/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          raceId: form.raceId,
          raceName: selectedRace?.name,
          raceDate: selectedRace?.date,
          raceDistance: selectedRace?.distance,
          raceType: selectedRace?.type,
          currentPace: form.currentPace,
          availableDays: form.availableDays,
          level: form.level,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Error generando el plan')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Error de conexión')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <nav className="border-b border-zinc-800 px-6 py-4">
          <Link href="/" className="text-lg font-bold text-green-400 tracking-tight">dorsal.pro</Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📬</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-50 mb-3">¡Plan generado!</h1>
            <p className="text-zinc-400 mb-6">
              Tu plan de entrenamiento personalizado para <strong className="text-zinc-100">{selectedRace?.name}</strong> está en camino. Revisa tu correo en unos minutos.
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              A partir de mañana recibirás el entrenamiento del día cada mañana. Responde al email con un <strong className="text-zinc-300">sí</strong> o <strong className="text-zinc-300">no</strong> para que el plan se adapte a ti.
            </p>
            <Link href="/races" className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl transition-colors">
              Ver más carreras →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-green-400 tracking-tight">dorsal.pro</Link>
        <Link href="/races" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">← Volver a carreras</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Dorsal Pro</span>
          <h1 className="text-2xl font-bold text-zinc-50 mt-1 mb-2">Genera tu plan de entrenamiento</h1>
          <p className="text-zinc-400 text-sm">Cuéntanos sobre ti y tu carrera. Claude creará un plan personalizado semana a semana.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tu email de Dorsal Pro *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tu@email.com"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
            />
          </div>

          {/* Race selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Carrera objetivo *</label>
            <select
              value={form.raceId}
              onChange={(e) => setForm({ ...form, raceId: e.target.value })}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Selecciona una carrera</option>
              {races.map((r) => {
                const date = new Date(r.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} — {date} ({r.type})
                  </option>
                )
              })}
            </select>
            {selectedRace && (
              <p className="text-xs text-zinc-500 mt-1.5">
                📍 {selectedRace.city}, {selectedRace.province} · {selectedRace.distance}
              </p>
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tu nivel *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['principiante', 'intermedio', 'avanzado'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setForm({ ...form, level: lvl })}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    form.level === lvl
                      ? 'bg-green-500 border-green-500 text-black'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Current pace */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Ritmo actual *
              <span className="text-zinc-500 font-normal ml-1">(ej: 5:30 min/km)</span>
            </label>
            <input
              type="text"
              value={form.currentPace}
              onChange={(e) => setForm({ ...form, currentPace: e.target.value })}
              placeholder="5:30 min/km"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
            />
          </div>

          {/* Available days */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Días disponibles por semana *
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, availableDays: String(d) })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                    form.availableDays === String(d)
                      ? 'bg-green-500 border-green-500 text-black'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-400">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Generando tu plan con IA...' : 'Generar mi plan de entrenamiento →'}
          </button>

          <p className="text-xs text-zinc-600 text-center">
            Recibirás el plan completo en PDF por email en unos minutos.
          </p>
        </form>
      </div>
    </div>
  )
}

export default function GenerarPlanPage() {
  return (
    <Suspense>
      <GenerarPlanForm />
    </Suspense>
  )
}
