import Link from 'next/link'

export default function BienvenidoProPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <nav className="border-b border-zinc-800 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-green-400 tracking-tight">dorsal.pro</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full text-center">

          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎉</span>
          </div>

          <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Dorsal Pro activado</span>
          <h1 className="text-3xl font-bold text-zinc-50 mt-2 mb-3">¡Bienvenido a Dorsal Pro!</h1>
          <p className="text-zinc-400 mb-10">
            Tu suscripción está activa. Ahora puedes generar tu plan de entrenamiento personalizado para tu próxima carrera.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8 text-left space-y-4">
            <p className="text-sm font-semibold text-zinc-300 mb-2">Próximos pasos:</p>
            {[
              { num: '01', text: 'Ve al calendario y elige tu carrera objetivo' },
              { num: '02', text: 'Indica tu nivel, ritmo actual y días disponibles' },
              { num: '03', text: 'Recibe tu plan personalizado en PDF por email' },
              { num: '04', text: 'Cada día te llega el entrenamiento del día' },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <span className="text-green-400 font-bold text-sm w-6 shrink-0">{step.num}</span>
                <span className="text-sm text-zinc-400">{step.text}</span>
              </div>
            ))}
          </div>

          <Link
            href="/pro/generar-plan"
            className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Generar mi plan de entrenamiento →
          </Link>
        </div>
      </div>
    </div>
  )
}
