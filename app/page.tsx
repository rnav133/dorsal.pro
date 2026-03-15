import Link from 'next/link'

const RACE_TYPES = ['5K', '10K', '15K', 'Media Maratón', 'Maratón', 'Hyrox', 'Trail', 'Obstáculos']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-green-400 tracking-tight">dorsal.pro</span>
        <div className="flex items-center gap-4">
          <Link href="/races" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
            Carreras
          </Link>
          <Link
            href="/subscribe"
            className="text-sm bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Suscribirse gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center max-w-3xl mx-auto">
        <div className="inline-block text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full mb-6 uppercase tracking-widest">
          Carreras populares en España
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-5 text-zinc-50">
          Encuentra tu próxima carrera.<br />
          <span className="text-green-400">Entrena para ganarla.</span>
        </h1>
        <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
          5K, 10K, media maratón, maratón, Hyrox y más. Descubre carreras en toda España y recibe cada semana las de tu zona.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/races"
            className="bg-green-500 hover:bg-green-400 text-black font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Ver carreras →
          </Link>
          <Link
            href="/subscribe"
            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Newsletter semanal gratis
          </Link>
        </div>
      </section>

      {/* Race types */}
      <section className="px-6 py-12 border-y border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center mb-6">Filtra por tipo de carrera</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {RACE_TYPES.map((type) => (
              <Link
                key={type}
                href={`/races?type=${encodeURIComponent(type)}`}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 text-zinc-300 hover:text-green-400 px-5 py-2 rounded-full text-sm font-medium transition-all"
              >
                {type}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-center mb-12">Cómo funciona</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Descubre', desc: 'Busca carreras por tipo, provincia o fecha en toda España.' },
            { step: '02', title: 'Suscríbete', desc: 'Recibe gratis cada viernes las carreras del fin de semana.' },
            { step: '03', title: 'Entrena', desc: 'Con Dorsal Pro, recibe un plan personalizado y el entreno del día.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-4xl font-bold text-green-400/20 mb-3">{item.step}</div>
              <h3 className="font-semibold text-zinc-100 mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pro CTA */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-800 p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
          <div className="relative">
            <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Dorsal Pro · 4,99 €/mes</span>
            <h2 className="text-3xl font-bold text-zinc-50 mt-2 mb-3">Tu entrenador personal, en el móvil</h2>
            <p className="text-zinc-400 mb-8 max-w-md">
              Marca la carrera, dinos tu nivel y disponibilidad. Tu entrenador personal preparará un plan adaptado a ti que se ajusta según tu progreso.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {[
                'Plan de entrenamiento personalizado en PDF',
                'Entrenamiento del día por email',
                'El plan se adapta a tu feedback',
                'Guía de nutrición según el entreno',
              ].map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-green-400 mt-0.5">✓</span>
                  {f}
                </div>
              ))}
            </div>
            <Link
              href="/subscribe?plan=pro"
              className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Empezar con Dorsal Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-600">
        © {new Date().getFullYear()} dorsal.pro · Hecho para corredores de España
      </footer>
    </div>
  )
}
