export const BELT_RANKS = [
  'white', 'yellow', 'green', 'blue', 'red',
  'black_1', 'black_2', 'black_3', 'black_4_plus',
]

export const BELT_LABELS = {
  white: 'White Belt',
  yellow: 'Yellow Belt',
  green: 'Green Belt',
  blue: 'Blue Belt',
  red: 'Red Belt',
  black_1: 'Black Belt 1st Dan',
  black_2: 'Black Belt 2nd Dan',
  black_3: 'Black Belt 3rd Dan',
  black_4_plus: 'Black Belt 4th Dan+',
}

// Swatch colours for belt badges and charts
export const BELT_COLORS = {
  white: '#E5E7EB', yellow: '#FACC15', green: '#22C55E', blue: '#3B82F6', red: '#EF4444',
  black_1: '#111827', black_2: '#111827', black_3: '#111827', black_4_plus: '#111827',
}

export const beltLabel = (b) => BELT_LABELS[b] || b || '—'
