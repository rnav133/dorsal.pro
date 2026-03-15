import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export const PLANS = {
  free: {
    name: 'Gratis',
    price: 0,
    features: [
      'Acceso al calendario de carreras',
      'Newsletter semanal con carreras del fin de semana',
      'Filtros por tipo y provincia',
    ],
  },
  pro: {
    name: 'Dorsal Pro',
    price: 4.99,
    priceId: process.env.STRIPE_PRICE_ID_MONTHLY!,
    features: [
      'Todo lo del plan gratuito',
      'Plan de entrenamiento personalizado en PDF',
      'Entrenamiento del día por email y WhatsApp',
      'Recomendaciones de nutrición según entrenamiento',
      'Marcar carreras como inscritas',
    ],
  },
}
