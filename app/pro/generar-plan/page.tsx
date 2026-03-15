'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Race } from '@/types'

const EQUIPMENT_OPTIONS = [
  'Gimnasio completo',
  'Mancuernas / pesas',
  'Kettlebell',
  'Bandas elásticas',
  'Peso corporal únicamente',
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest pt-2 pb-1 border-t border-zinc-800">
      {children}
    </p>
  )
}

function OptionalBadge() {
  return <span className="text-zinc-600 font-normal ml-1 normal-case tracking-normal text-xs">(opcional)</span>
}

function GenerarPlanForm() {
  const searchParams = useSearchParams()
  const preselectedRaceId = searchParams.get('raceId')

  const [races, setRaces] = useState<Race[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])

  const [form, setForm] = useState({
    email: '',
    raceId: preselectedRaceId || '',
    currentPace: '',
    availableDays: '3',
    level: 'intermedio' as 'principiante' | 'intermedio' | 'avanzado',
    // Optional fields
    injuries: '',
    recentRaceResults: '',
    vo2max: '',
    weeklyKm: '',
    strengthDays: '1',
    extraInfo: '',
  })

  useEffect(() => {
    fetch('/api/races')
      .then((r) => r.json())
      .then((data) => setRaces(data.filter((r: Race) => r.name && r.date)))
  }, [])

  const selectedRace = races.find((r) => r.id === form.raceId)

  function toggleEquipment(item: string) {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    )
  }

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
          injuries: form.injuries,
          recentRaceResults: form.recentRaceResults,
          vo2max: form.vo2max,
          weeklyKm: form.weeklyKm,
          strengthDays: form.strengthDays,
          equipment: selectedEquipment,
          extraInfo: form.extraInfo,
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
            <h1 className="text-2xl font-bold text-zinc-50 mb-3">¡Solicitud recibida!</h1>
            <p className="text-zinc-400 mb-4">
              Nuestro equipo ya está trabajando en tu plan personalizado para <strong className="text-zinc-100">{selectedRace?.name}</strong>.
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              En breve recibirás tu plan completo en el correo. A partir de entonces, cada mañana te llegará el entrenamiento del día. Responde con un <strong className="text-zinc-300">sí</strong> o <strong className="text-zinc-300">no</strong> para que tu entrenador ajuste el plan según cómo te encuentres.
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
          <h1 className="text-2xl font-bold text-zinc-50 mt-1 mb-2">Tu plan de entrenamiento</h1>
          <p className="text-zinc-400 text-sm">Cuanta más información nos des, mejor y más preciso será tu plan. Los campos marcados con * son obligatorios.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── DATOS BÁSICOS ── */}
          <SectionTitle>Datos básicos</SectionTitle>

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
                return <option key={r.id} value={r.id}>{r.name} — {date} ({r.type})</option>
              })}
            </select>
            {selectedRace && (
              <p className="text-xs text-zinc-500 mt-1.5">📍 {selectedRace.city}, {selectedRace.province} · {selectedRace.distance}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tu nivel *</label>
            <div className="grid grid-cols-3 gap-2">
              {(['principiante', 'intermedio', 'avanzado'] as const).map((lvl) => (
                <button key={lvl} type="button" onClick={() => setForm({ ...form, level: lvl })}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize ${form.level === lvl ? 'bg-green-500 border-green-500 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Ritmo actual * <span className="text-zinc-500 font-normal">(ej: 5:30 min/km)</span>
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

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Días disponibles para entrenar por semana *</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map((d) => (
                <button key={d} type="button" onClick={() => setForm({ ...form, availableDays: String(d) })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors ${form.availableDays === String(d) ? 'bg-green-500 border-green-500 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* ── RENDIMIENTO ── */}
          <SectionTitle>Rendimiento <OptionalBadge /></SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                VO2max <OptionalBadge />
              </label>
              <input
                type="number"
                value={form.vo2max}
                onChange={(e) => setForm({ ...form, vo2max: e.target.value })}
                placeholder="ej: 52"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Km semanales actuales <OptionalBadge />
              </label>
              <input
                type="number"
                value={form.weeklyKm}
                onChange={(e) => setForm({ ...form, weeklyKm: e.target.value })}
                placeholder="ej: 30"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Resultados de carreras recientes <OptionalBadge />
              <span className="text-zinc-600 block font-normal text-xs mt-0.5">Ej: "10K en 52 min hace 2 meses", "Media maratón en 1h58 el año pasado"</span>
            </label>
            <textarea
              value={form.recentRaceResults}
              onChange={(e) => setForm({ ...form, recentRaceResults: e.target.value })}
              placeholder="Escribe tus resultados más recientes..."
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600 resize-none"
            />
          </div>

          {/* ── FUERZA ── */}
          <SectionTitle>Entrenamiento de fuerza <OptionalBadge /></SectionTitle>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Días de fuerza por semana <OptionalBadge />
            </label>
            <div className="flex gap-2">
              {['0', '1', '2'].map((d) => (
                <button key={d} type="button" onClick={() => setForm({ ...form, strengthDays: d })}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold border transition-colors ${form.strengthDays === d ? 'bg-green-500 border-green-500 text-black' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                  {d === '0' ? 'Ninguno' : d}
                </button>
              ))}
            </div>
          </div>

          {form.strengthDays !== '0' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Material disponible</label>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((item) => (
                  <button key={item} type="button" onClick={() => toggleEquipment(item)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedEquipment.includes(item) ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SALUD ── */}
          <SectionTitle>Salud y limitaciones <OptionalBadge /></SectionTitle>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Lesiones o molestias actuales <OptionalBadge />
              <span className="text-zinc-600 block font-normal text-xs mt-0.5">Ej: "rodilla derecha", "fascitis plantar leve", "ninguna"</span>
            </label>
            <input
              type="text"
              value={form.injuries}
              onChange={(e) => setForm({ ...form, injuries: e.target.value })}
              placeholder="Describe cualquier lesión o molestia..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
            />
          </div>

          {/* ── EXTRA ── */}
          <SectionTitle>Información adicional <OptionalBadge /></SectionTitle>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Cuéntanos lo que quieras <OptionalBadge />
              <span className="text-zinc-600 block font-normal text-xs mt-0.5">Objetivos, limitaciones de tiempo, preferencias de entrenamiento...</span>
            </label>
            <textarea
              value={form.extraInfo}
              onChange={(e) => setForm({ ...form, extraInfo: e.target.value })}
              placeholder="Cualquier información que creas relevante para tu entrenador..."
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600 resize-none"
            />
          </div>

          {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
          >
            {status === 'loading' ? 'Enviando datos a tu entrenador...' : 'Solicitar mi plan de entrenamiento →'}
          </button>

          <p className="text-xs text-zinc-600 text-center">Recibirás tu plan personalizado en el correo en breve.</p>
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
