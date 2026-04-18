// ─── Feature Flags ───────────────────────────────────────
// Set to true to activate real API integrations.
// All services fall back to mock data when false.
export const FEATURES = {
  AI_ITINERARY: false,  // → Claude API
  WHATSAPP: false,  // → Meta Cloud API
  PUSH_NOTIFS: false,  // → Web Push API
  PAYMENTS: false,  // → Culqi / Yape
  REAL_WEATHER: false,  // → OpenWeather API
  REAL_AUTH: true,  // → Supabase Auth
} as const

// ─── App Config ──────────────────────────────────────────
export const PIURA_CENTER = { lat: -5.1945, lng: -80.6328 }
export const MOCK_DELAY_MS = 600

export const INTEREST_OPTIONS = [
  { id: 'playa', emoji: '🏖️', label: 'Playa y mar' },
  { id: 'gastronomia', emoji: '🍽️', label: 'Gastronomía' },
  { id: 'sierra', emoji: '🏔️', label: 'Sierra' },
  { id: 'cultura', emoji: '🎨', label: 'Arte y cultura' },
  { id: 'aventura', emoji: '🌊', label: 'Aventura' },
  { id: 'mercados', emoji: '🛍️', label: 'Mercados' },
  { id: 'foto', emoji: '📸', label: 'Fotografía' },
  { id: 'relax', emoji: '☕', label: 'Café y relax' },
] as const

export const TIME_OPTIONS = [
  { id: '4h', emoji: '⏱️', label: 'Menos de 4h', sub: 'Visita rápida' },
  { id: '6h', emoji: '🌅', label: 'Medio día', sub: '4–6 horas' },
  { id: 'full', emoji: '☀️', label: 'Día completo', sub: '6+ horas' },
  { id: 'weekend', emoji: '📅', label: 'Fin de semana', sub: '2 días' },
] as const

export const GROUP_OPTIONS = [
  { id: 'solo', emoji: '👤', label: 'Solo/a' },
  { id: 'couple', emoji: '👫', label: 'En pareja' },
  { id: 'family', emoji: '👨‍👩‍👧', label: 'Familia' },
  { id: 'friends', emoji: '👯', label: 'Amigos' },
] as const

export const BUDGET_OPTIONS = [
  { id: 'low', emoji: '💸', label: 'Económico', sub: 'Hasta S/50' },
  { id: 'mid', emoji: '👌', label: 'Moderado', sub: 'S/50–S/150' },
  { id: 'high', emoji: '✨', label: 'Sin límite', sub: 'Lo mejor' },
] as const

export const CATEGORY_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  playa: { emoji: '🏖️', label: 'Playa', color: '#00b4d8' },
  gastronomia: { emoji: '🍽️', label: 'Gastronomía', color: '#e63946' },
  cultura: { emoji: '🎨', label: 'Cultura', color: '#7209b7' },
  sierra: { emoji: '🏔️', label: 'Sierra', color: '#2d6a4f' },
  aventura: { emoji: '🌊', label: 'Aventura', color: '#0077b6' },
  mercados: { emoji: '🛍️', label: 'Mercados', color: '#f4a261' },
  relax: { emoji: '☕', label: 'Relax', color: '#8b5e3c' },
}

export const ZONES = [
  'Piura', 'Catacaos', 'Paita', 'Colán', 'Yacila',
  'Talara', 'Lobitos', 'Canchaque', 'Chulucanas',
  'Huancabamba', 'Sechura', 'Sullana',
]
