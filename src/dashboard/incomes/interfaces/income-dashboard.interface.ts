export interface SmartSummary {
  averageMonthlyIncome: number;
  largestSource: { name: string; amount: number; };
  nextExpectedIncome: { name: string; amount: number; };
  trend: { percentage: number; vs: string; };
}

export interface MonthlyGoal {
  progress: number;
  goal: number;
  percentageCompleted: number;
  remaining: number;
}

export interface AnnualProjection {
  recurringMonthlyIncome: number;
  projectedAnnualIncome: number;
  upcomingRecurringIncomes: { id: string; title: string; amount: number; }[];
}

export interface IncomesByCategory {
  categoryId: string;
  name: string;
  emoji: string;
  color: string | undefined;
  total: number;
  percentage: number;
}

export interface IncomesDashboard {
  smartSummary: SmartSummary;
  monthlyGoal: MonthlyGoal | null;
  annualProjection: AnnualProjection;
  incomesByCategorySummary: IncomesByCategory[] | null
}