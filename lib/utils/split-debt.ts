interface Expense {
  id: string
  payer_id: string
  amount: number
}

interface Split {
  expense_id: string
  user_id: string
  share: number
}

export interface Debt {
  from: string
  to: string
  amount: number
}

export function computeDebts(expenses: Expense[], splits: Split[]): Debt[] {
  const balances = new Map<string, number>()
  for (const e of expenses) {
    balances.set(e.payer_id, (balances.get(e.payer_id) ?? 0) + e.amount)
    const expSplits = splits.filter((s) => s.expense_id === e.id)
    for (const s of expSplits) {
      const owed = e.amount * Number(s.share)
      balances.set(s.user_id, (balances.get(s.user_id) ?? 0) - owed)
    }
  }
  const creditors = [...balances.entries()]
    .filter(([, v]) => v > 1)
    .sort((a, b) => b[1] - a[1])
  const debtors = [...balances.entries()]
    .filter(([, v]) => v < -1)
    .sort((a, b) => a[1] - b[1])
  const debts: Debt[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const [dId, dVal] = debtors[i]
    const [cId, cVal] = creditors[j]
    const amount = Math.min(-dVal, cVal)
    debts.push({ from: dId, to: cId, amount })
    debtors[i][1] += amount
    creditors[j][1] -= amount
    if (Math.abs(debtors[i][1]) < 1) i++
    if (creditors[j][1] < 1) j++
  }
  return debts
}
