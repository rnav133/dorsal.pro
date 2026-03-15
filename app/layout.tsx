import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'dorsal.pro | Carreras populares en España',
  description:
    'Encuentra carreras de 5K, 10K, media maratón, maratón y más en toda España. Suscríbete y recibe el calendario de carreras cada semana.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
