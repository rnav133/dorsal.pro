export type RaceType =
  | '5K'
  | '10K'
  | '15K'
  | 'Media Maratón'
  | 'Maratón'
  | 'Hyrox'
  | 'Trail'
  | 'Obstáculos'
  | 'Otra'

export interface Race {
  id: string
  name: string
  date: string
  type: RaceType | string
  distance: string
  province: string
  city: string
  registerUrl: string
  price?: number
  description?: string
  imageUrl?: string
  featured?: boolean
}

export interface Subscriber {
  id: string
  email: string
  name?: string
  plan: 'free' | 'pro'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: string
  preferences?: {
    types?: RaceType[]
    provinces?: string[]
  }
}

export interface TrainingPlan {
  id: string
  userId: string
  raceId: string
  raceName: string
  raceDate: string
  createdAt: string
  pdfUrl?: string
  weeks: TrainingWeek[]
}

export interface TrainingWeek {
  week: number
  days: TrainingDay[]
}

export interface TrainingDay {
  day: string
  workout: string
  duration: string
  intensity: 'baja' | 'media' | 'alta'
  nutrition?: NutritionGuidance
}

export interface NutritionGuidance {
  preworkout?: string
  postworkout?: string
  notes?: string
}
