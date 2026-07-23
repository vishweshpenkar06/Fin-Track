export interface Expense {
  id: string
  userId: string
  amount: string
  category: string
  description: string | null
  date: string
  paymentMethod: string | null
  receipt: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Budget {
  id: string
  userId: string
  category: string
  limit: string
  spent: string
  month: string
  alerts: boolean | null
  createdAt: Date
  updatedAt: Date
}

export interface Income {
  id: string
  userId: string
  amount: string
  source: string
  date: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  date: string
  type: 'expense' | 'income'
}
