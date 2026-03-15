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
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-500 tracking-tight">dorsal.run</Link>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Newsletter semanal gratuita</h1>
          <p className="text-slate-500">
            Cada viernes recibes en tu correo las carreras del fin de semana — nombre, fecha, lugar y enlace de inscripción.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-6 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="font-semibold">{message}</p>
            <Link href="/races" className="mt-4 inline-block text-sm text-orange-500 hover:underline">
              Ver carreras próximas →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre (opcional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-400"
              />
            </div>
            {status === 'error' && (
              <p className="text-sm text-red-500">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {status === 'loading' ? 'Suscribiendo...' : 'Suscribirme gratis'}
            </button>
            <p className="text-xs text-slate-400 text-center">
              Sin spam. Cancela cuando quieras.
            </p>
          </form>
        )}

        {/* Pro upsell */}
        <div className="mt-12 border border-orange-100 rounded-xl p-6 bg-orange-50">
          <p className="text-sm font-semibold text-orange-600 mb-1">¿Quieres más? — Dorsal Pro</p>
          <p className="text-sm text-slate-600 mb-3">
            Plan de entrenamiento personalizado, entrenamiento del día por WhatsApp y guía de nutrición. Todo por 4,99 €/mes.
          </p>
          <Link
            href="/subscribe?plan=pro"
            className="text-sm font-semibold text-orange-500 hover:text-orange-600"
          >
            Saber más sobre Dorsal Pro →
          </Link>
        </div>
      </div>
    </div>
  )
}
