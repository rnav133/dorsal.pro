'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Race, RaceType } from '@/types'

const RACE_TYPES: RaceType[] = ['5K', '10K', '15K', 'Media Maratón', 'Maratón', 'Hyrox', 'Trail', 'Obstáculos', 'Otra']
const PROVINCES = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga',
  'Murcia', 'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Granada',
]

export default function RacesPage() {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (provinceFilter) params.set('province', provinceFilter)
    setLoading(true)
    fetch(`/api/races?${params}`)
      .then((r) => r.json())
      .then((data) => { setRaces(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [typeFilter, provinceFilter])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-green-400 tracking-tight">dorsal.pro</Link>
        <Link href="/subscribe" className="text-sm bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors">
          Suscribirse gratis
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-50 mb-2">Carreras en España</h1>
        <p className="text-zinc-400 text-sm mb-8">Filtra por tipo de carrera o provincia</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {RACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Todas las provincias</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(typeFilter || provinceFilter) && (
            <button
              onClick={() => { setTypeFilter(''); setProvinceFilter('') }}
              className="text-sm text-zinc-500 hover:text-zinc-300 px-3 py-2 transition-colors"
            >
              Limpiar ✕
            </button>
          )}
        </div>

        {/* Race list */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500">Cargando carreras...</div>
        ) : races.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">No hay carreras con estos filtros</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {races.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RaceCard({ race }: { race: Race }) {
  const date = new Date(race.date)
  const formattedDate = date.toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'long',
  })

  return (
    <div className="bg-zinc-900 border border-zinc-800 hover:border-green-500/40 rounded-xl p-5 transition-all hover:bg-zinc-800/80 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
          {race.type}
        </span>
        {race.featured && <span className="text-xs text-zinc-500">⭐ Destacada</span>}
      </div>
      <h3 className="font-semibold text-zinc-100 text-sm leading-snug mb-3 group-hover:text-green-400 transition-colors">
        {race.name || '(sin nombre)'}
      </h3>
      <div className="space-y-1 mb-4">
        <p className="text-xs text-zinc-500">📍 {race.city}, {race.province}</p>
        <p className="text-xs text-zinc-500">📅 {formattedDate}</p>
        {race.distance && <p className="text-xs text-zinc-500">📏 {race.distance}</p>}
        {race.price !== undefined && race.price > 0 && (
          <p className="text-xs text-zinc-500">💶 {race.price} €</p>
        )}
      </div>
      <div className="flex gap-2">
        {race.registerUrl && (
          <a
            href={race.registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold bg-zinc-800 group-hover:bg-green-500 group-hover:text-black text-zinc-300 border border-zinc-700 group-hover:border-green-500 py-2 rounded-lg transition-all"
          >
            Inscribirse →
          </a>
        )}
        <Link
          href={`/pro/generar-plan?raceId=${race.id}`}
          className="flex-1 text-center text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-green-400 border border-zinc-700 py-2 rounded-lg transition-all"
          title="Generar plan de entrenamiento (Dorsal Pro)"
        >
          📋 Mi plan
        </Link>
      </div>
    </div>
  )
}
