import { UserPlus, RefreshCcw, Shirt, Award, Trophy, Tag } from 'lucide-react'

// Kinds of non-monthly fees in the Fee Setup catalogue (one_time_fee_types.category)
export const CATEGORIES = [
  { key: 'admission', label: 'Admission', icon: UserPlus, color: '#C9A24A', frequency: 'one_time' },
  { key: 'annual', label: 'Annual & renewal', icon: RefreshCcw, color: '#2D5BD0', frequency: 'annual' },
  { key: 'uniform', label: 'Uniform & gear', icon: Shirt, color: '#0E8A6A', frequency: 'per_event' },
  { key: 'grading', label: 'Belt grading', icon: Award, color: '#B45309', frequency: 'per_event' },
  { key: 'event', label: 'Tournaments & events', icon: Trophy, color: '#9F1D2C', frequency: 'per_event' },
  { key: 'other', label: 'Other', icon: Tag, color: '#5C6273', frequency: 'one_time' },
]
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

export const FREQUENCIES = [
  { key: 'one_time', label: 'Once per student' },
  { key: 'annual', label: 'Every year' },
  { key: 'per_event', label: 'Each time' },
]
export const FREQUENCY = Object.fromEntries(FREQUENCIES.map((f) => [f.key, f]))

// Starting list for "Add common fees" — amounts are placeholders the admin adjusts
export const TEMPLATES = [
  { name: 'Admission fee', category: 'admission', frequency: 'one_time', amount: 1000, description: 'Charged once when a student joins.' },
  { name: 'Registration & ID card', category: 'admission', frequency: 'one_time', amount: 200, description: 'Student record and photo ID card.' },
  { name: 'Annual renewal', category: 'annual', frequency: 'annual', amount: 500, description: 'Yearly membership renewal each April.' },
  { name: 'Association / federation registration', category: 'annual', frequency: 'annual', amount: 300, description: 'Yearly registration with the state association.' },
  { name: 'Dobok (uniform)', category: 'uniform', frequency: 'per_event', amount: 1200 },
  { name: 'Sparring gear set', category: 'uniform', frequency: 'per_event', amount: 2500, description: 'Head guard, chest guard, shin & forearm guards.' },
  { name: 'Grading — Yellow belt', category: 'grading', frequency: 'per_event', belt: 'yellow', amount: 300 },
  { name: 'Grading — Green belt', category: 'grading', frequency: 'per_event', belt: 'green', amount: 400 },
  { name: 'Grading — Blue belt', category: 'grading', frequency: 'per_event', belt: 'blue', amount: 500 },
  { name: 'Grading — Red belt', category: 'grading', frequency: 'per_event', belt: 'red', amount: 600 },
  { name: 'Black belt (1st Dan) examination', category: 'grading', frequency: 'per_event', belt: 'black_1', amount: 3000 },
  { name: 'Tournament entry', category: 'event', frequency: 'per_event', amount: 500 },
  { name: 'Training camp', category: 'event', frequency: 'per_event', amount: 1500 },
]
