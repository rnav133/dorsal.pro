'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SubscribePage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('¡Apuntado! Recibirás las carreras del fin de semana cada viernes.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Algo salió mal. Inténtalo de nuevo.')
      }
    } catch {
      setStatus('error')
      setMessage('Error de conexión. Inténtalo de nuevo.')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-green-400 tracking-tight">dorsal.pro</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="inline-block text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Gratis
          </div>
          <h1 className="text-3xl font-bold text-zinc-50 mb-3">Newsletter semanal</h1>
          <p className="text-zinc-400">
            Cada viernes recibes las carreras del fin de semana — nombre, lugar, fecha y enlace de inscripción.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-8 text-center">
            <p className="text-3xl mb-3">🎉</p>
            <p className="font-semibold text-zinc-100 mb-1">¡Ya eres parte de dorsal.pro!</p>
            <p className="text-sm text-zinc-400 mb-4">{message}</p>
            <Link href="/races" className="text-sm text-green-400 hover:text-green-300 transition-colors">
              Ver carreras próximas →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nombre (opcional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-zinc-600"
              />
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-400">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
            >
              {status === 'loading' ? 'Suscribiendo...' : 'Suscribirme gratis'}
            </button>
            <p className="text-xs text-zinc-600 text-center">Sin spam. Cancela cuando quieras.</p>
          </form>
        )}

        {/* Pro upsell */}
        <div className="mt-12 border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-green-400">Dorsal Pro</p>
            <span className="text-xs font-bold text-zinc-100">4,99 €/mes</span>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Plan de entrenamiento personalizado con IA, entrenamiento del día y guía de nutrición.
          </p>
          <Link
            href="/subscribe?plan=pro"
            className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
          >
            Saber más sobre Dorsal Pro →
          </Link>
        </div>
      </div>
    </div>
  )
}
