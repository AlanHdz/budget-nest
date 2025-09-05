import { Frequency } from "../../../../generated/prisma";


interface DashboardSummary {
  totalExpenses: {
    amount: number;
    percentageChange: number;
  };
  subscriptions: {
    monthlyTotal: number;
    monthlyCount: number;
  };
  remainingBudget: {
    amount: number;
    percentageAvailable: number;
    totalBudget: number;
  };
}

export interface ExpenseByCategory {
  categoryId: string | undefined;
  name: string | undefined;
  color: string | undefined;
  amount: number;
  percentage: number;
}

export interface BudgetVsExpense {
  categoryId: string;
  name: string;
  color: string;
  spent: number;
  budget: number;
  remaining: number;
  percentage: number;
}

export interface SubscriptionDetail {
  id: string;
  title: string;
  amount: number;
  frequency: Frequency;
  category: {
    id: string;
    name: string;
  };
}

export interface DashboardInterface {
  summary: DashboardSummary;
  expensesByCategory: ExpenseByCategory[];
  budgetVsExpenses: BudgetVsExpense[];
  subscriptionDetails: {
    list: SubscriptionDetail[];
    projectedAnnualExpense: number;
  }
}