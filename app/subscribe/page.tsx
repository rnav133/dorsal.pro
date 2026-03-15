'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SubscribeForm() {
  const searchParams = useSearchParams()
  const isPro = searchParams.get('plan') === 'pro'
  const cancelled = searchParams.get('cancelled') === 'true'

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleFreeSubmit(e: React.FormEvent) {
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

  async function handleProSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        setStatus('error')
        setMessage(data.error || 'Error al iniciar el pago.')
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

        {/* Plan toggle */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-10">
          <Link
            href="/subscribe"
            className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${!isPro ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Gratis
          </Link>
          <Link
            href="/subscribe?plan=pro"
            className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${isPro ? 'bg-green-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Dorsal Pro · 4,99 €/mes
          </Link>
        </div>

        {cancelled && (
          <div className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm rounded-xl p-4 mb-6 text-center">
            Pago cancelado. Puedes intentarlo de nuevo cuando quieras.
          </div>
        )}

        <div className="text-center mb-8">
          {isPro ? (
            <>
              <div className="inline-block text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                Pro · 4,99 €/mes
              </div>
              <h1 className="text-3xl font-bold text-zinc-50 mb-3">Dorsal Pro</h1>
              <p className="text-zinc-400">Plan de entrenamiento personalizado con IA, entrenamiento del día y nutrición.</p>
            </>
          ) : (
            <>
              <div className="inline-block text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                Gratis
              </div>
              <h1 className="text-3xl font-bold text-zinc-50 mb-3">Newsletter semanal</h1>
              <p className="text-zinc-400">Cada viernes, las carreras del fin de semana en tu correo.</p>
            </>
          )}
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
          <form onSubmit={isPro ? handleProSubmit : handleFreeSubmit} className="space-y-4">
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

            {isPro && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                {[
                  'Plan de entrenamiento personalizado en PDF',
                  'Entrenamiento del día por email',
                  'El plan se adapta a tu feedback',
                  'Guía de nutrición según el entreno',
                  'Cancela cuando quieras',
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="text-green-400">✓</span> {f}
                  </div>
                ))}
              </div>
            )}

            {status === 'error' && (
              <p className="text-sm text-red-400">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className={`w-full font-bold py-3 rounded-xl transition-colors disabled:opacity-50 ${
                isPro
                  ? 'bg-green-500 hover:bg-green-400 text-black'
                  : 'bg-green-500 hover:bg-green-400 text-black'
              }`}
            >
              {status === 'loading'
                ? 'Cargando...'
                : isPro
                ? 'Ir al pago seguro →'
                : 'Suscribirme gratis'}
            </button>
            <p className="text-xs text-zinc-600 text-center">
              {isPro ? 'Pago seguro con Stripe. Cancela cuando quieras.' : 'Sin spam. Cancela cuando quieras.'}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function SubscribePage() {
  return (
    <Suspense>
      <SubscribeForm />
    </Suspense>
  )
}
