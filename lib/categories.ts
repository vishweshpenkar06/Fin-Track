export const CATEGORIES = [
  'Dining',
  'Rent',
  'Transport',
  'Groceries',
  'Entertainment',
  'Utilities',
  'Income',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Dining: '#FF6B6B',
    Rent: '#4F8CFF',
    Transport: '#FFB84D',
    Groceries: '#22C55E',
    Entertainment: '#8B5CF6',
    Utilities: '#06B6D4',
    Income: '#22C55E',
    Other: '#9AA1AB',
  }
  return colors[category] || '#9AA1AB'
}
