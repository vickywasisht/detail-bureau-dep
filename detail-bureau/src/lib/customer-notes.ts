export const NOTE_CATEGORIES = [
  { value: 'vehicle_condition', label: 'Vehicle Condition' },
  { value: 'customer_preference', label: 'Customer Preference' },
  { value: 'special_request', label: 'Special Request' },
  { value: 'general_observation', label: 'General Observation' },
  { value: 'other', label: 'Other' },
] as const

export const NOTE_MAX_LENGTH = 2000

export const categoryLabel = (value: string) =>
  NOTE_CATEGORIES.find(c => c.value === value)?.label ?? value

// returns an error message, or null when the input is valid
export function validateNote(body: unknown, category: unknown): string | null {
  const text = typeof body === 'string' ? body.trim() : ''
  if (!text) return 'Note text is required.'
  if (text.length > NOTE_MAX_LENGTH) return `Notes can be at most ${NOTE_MAX_LENGTH} characters.`
  if (!NOTE_CATEGORIES.some(c => c.value === category)) return 'Choose a category.'
  return null
}
