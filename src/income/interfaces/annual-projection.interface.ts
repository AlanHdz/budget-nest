

export interface AnnualProjection {
  recurringMonthlyIncome: number
  projectedAnnualIncome: number
  upcomingRecurringIncomes: UpcomingRecurringIncome[]
}

interface UpcomingRecurringIncome {
  title: string
  amount: number
}