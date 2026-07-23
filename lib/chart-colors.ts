// Chart color palette matching CSS theme variables (--chart-1 through --chart-5)
// and extending with additional colors for more categories
export const CHART_COLORS = [
  'var(--chart-1)', // #4f8cff - primary blue
  'var(--chart-2)', // #22c55e - secondary green
  'var(--chart-3)', // #f59e0b - warning amber
  'var(--chart-4)', // #8b5cf6 - purple
  'var(--chart-5)', // #ec4899 - pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a855f7', // violet
]

// Hardcoded fallback for contexts where CSS variables aren't available
// (e.g., SVG fills in server-rendered charts)
export const CHART_COLORS_HEX = [
  '#4f8cff',
  '#22c55e',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
  '#a855f7',
]
