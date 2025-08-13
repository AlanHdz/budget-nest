

export interface SmartSummary {
  averageMonthlyIncome: number;
  largestSource: LargestSource;
  nextExpectedIncome: NextExpectedIncome;
  trend: Trend;
}


interface LargestSource {
  name: string
  amount: number
}

interface NextExpectedIncome {
  name: string
  amount: number
}

interface Trend {
  percentage: number
  vs: string
}