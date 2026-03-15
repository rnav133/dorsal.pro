import Link from 'next/link'

const RACE_TYPES = ['5K', '10K', '15K', 'Media Maratón', 'Maratón', 'Hyrox', 'Trail', 'Obstáculos']

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-orange-500 tracking-tight">dorsal.pro</span>
        <div className="flex items-center gap-4">
          <Link href="/races" className="text-sm text-slate-600 hover:text-slate-900">
            Carreras
          </Link>
          <Link
            href="/subscribe"
            className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Suscribirse gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-4">
          Todas las carreras populares de España,<br />
          <span className="text-orange-500">en un solo lugar</span>
        </h1>
        <p className="text-xl text-slate-500 mb-8 max-w-xl mx-auto">
          5K, 10K, media maratón, maratón, Hyrox y más. Descubre, filtra y recibe cada semana las carreras de tu zona.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/races"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Ver carreras
          </Link>
          <Link
            href="/subscribe"
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Newsletter semanal gratis
          </Link>
        </div>
      </section>

      {/* Race types */}
      <section className="px-6 py-12 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Filtra por tipo de carrera</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {RACE_TYPES.map((type) => (
              <Link
                key={type}
                href={`/races?type=${encodeURIComponent(type)}`}
                className="bg-white border border-slate-200 hover:border-orange-400 hover:text-orange-600 text-slate-700 px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                {type}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pro CTA */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-10 text-white">
          <span className="text-sm font-semibold uppercase tracking-widest opacity-80">Dorsal Pro</span>
          <h2 className="text-3xl font-bold mt-2 mb-3">Entrena para tu próxima carrera</h2>
          <p className="opacity-90 mb-6 max-w-md mx-auto">
            Marca la carrera, recibe tu plan de entrenamiento personalizado y el entrenamiento del día en tu móvil.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ul className="text-left text-sm space-y-2 opacity-90">
              <li>✓ Plan de entrenamiento en PDF</li>
              <li>✓ Entrenamiento del día por WhatsApp y email</li>
              <li>✓ Guía de nutrición según el entreno</li>
            </ul>
            <Link
              href="/subscribe?plan=pro"
              className="bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors whitespace-nowrap"
            >
              4,99 €/mes →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} dorsal.pro · Hecho con ❤️ para corredores de España</p>
      </footer>
    </div>
  )
}
