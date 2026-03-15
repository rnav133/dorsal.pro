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
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-500 tracking-tight">dorsal.run</Link>
        <Link href="/subscribe" className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Suscribirse gratis
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Carreras en España</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Todos los tipos</option>
            {RACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Todas las provincias</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {(typeFilter || provinceFilter) && (
            <button
              onClick={() => { setTypeFilter(''); setProvinceFilter('') }}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2"
            >
              Limpiar filtros ✕
            </button>
          )}
        </div>

        {/* Race list */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Cargando carreras...</div>
        ) : races.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No hay carreras con estos filtros</div>
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
    <div className="border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
      {race.featured && (
        <span className="text-xs font-semibold text-orange-500 uppercase tracking-wide">⭐ Destacada</span>
      )}
      <div className="flex items-start justify-between mt-1 mb-2">
        <span className="text-xs font-medium bg-orange-50 text-orange-600 px-2 py-1 rounded-full">{race.type}</span>
        <span className="text-xs text-slate-400">{race.distance}</span>
      </div>
      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{race.name}</h3>
      <p className="text-xs text-slate-500 mb-1">📍 {race.city}, {race.province}</p>
      <p className="text-xs text-slate-500 mb-4">📅 {formattedDate}</p>
      {race.price !== undefined && (
        <p className="text-xs text-slate-500 mb-3">💶 {race.price > 0 ? `${race.price} €` : 'Precio no disponible'}</p>
      )}
      {race.registerUrl && (
        <a
          href={race.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg transition-colors"
        >
          Inscribirse →
        </a>
      )}
    </div>
  )
}
