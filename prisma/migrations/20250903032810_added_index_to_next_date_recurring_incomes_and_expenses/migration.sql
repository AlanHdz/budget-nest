-- CreateIndex
CREATE INDEX "RecurringExpense_nextDueDate_idx" ON "RecurringExpense"("nextDueDate");

-- CreateIndex
CREATE INDEX "RecurringIncome_nextDate_idx" ON "RecurringIncome"("nextDate");
