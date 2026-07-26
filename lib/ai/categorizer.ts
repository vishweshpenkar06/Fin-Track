// Smart categorization based on description keywords
// No external API needed — uses pattern matching

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Dining': ['restaurant', 'food', 'coffee', 'starbucks', 'mcdonald', 'pizza', 'burger', 'sushi', 'cafe', 'diner', 'lunch', 'dinner', 'breakfast', 'meal', 'eat', 'takeout', 'delivery', 'doordash', 'ubereats', 'uber eats', 'grubhub'],
  'Groceries': ['grocery', 'walmart', 'target', 'costco', 'whole foods', 'trader joe', 'aldi', 'kroger', 'safeway', 'publix', 'market', 'supermarket', 'produce', 'meat', 'dairy'],
  'Transport': ['uber ride', 'lyft ride', 'gas', 'fuel', 'oil change', 'tire', 'parking', 'toll', 'transit', 'metro', 'bus pass', 'train', 'airline', 'flight', 'rental car', 'car wash'],
  'Entertainment': ['netflix', 'spotify', 'hulu', 'disney plus', 'movie', 'concert', 'ticket', 'game', 'steam', 'playstation', 'xbox', 'nintendo', 'book', 'kindle', 'audible'],
  'Utilities': ['electric', 'electricity', 'gas bill', 'water bill', 'internet', 'wifi', 'phone bill', 'mobile', 'verizon', 'att', 't-mobile', 'comcast', 'utility'],
  'Rent': ['rent', 'lease', 'apartment', 'mortgage', 'housing'],
  'Healthcare': ['doctor', 'hospital', 'pharmacy', 'cvs', 'walgreen', 'medical', 'dental', 'vision', 'insurance', 'health'],
  'Shopping': ['amazon', 'ebay', 'etsy', 'clothing', 'shoes', 'electronics', 'apple store', 'best buy'],
  'Education': ['tuition', 'school', 'university', 'course', 'udemy', 'coursera', 'textbook', 'supplies'],
  'Subscriptions': ['membership', 'gym', 'fitness', 'pro plan', 'annual fee'],
  'Income': ['salary', 'paycheck', 'direct deposit', 'freelance', 'payment received', 'dividend', 'interest earned'],
}

export function suggestCategory(description: string): string | null {
  if (!description) return null

  const lower = description.toLowerCase()
  let bestMatch: string | null = null
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        score += keyword.length // Longer matches score higher
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = category
    }
  }

  return bestMatch
}

export function getSuggestionConfidence(description: string): number {
  if (!description) return 0

  const lower = description.toLowerCase()
  let totalMatches = 0

  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) totalMatches++
    }
  }

  // 0 matches = 0%, 3+ matches = 90%+
  return Math.min(totalMatches / 3, 1)
}
