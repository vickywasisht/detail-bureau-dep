// Shared by the browser and the server. No secrets in here.

export const DEPOSIT_PERCENT = 25   // change this to change the deposit size
export const CURRENCY = 'cad'       // Stripe currency code (lowercase)

export type PaymentType = 'deposit' | 'full' | 'balance'
export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded'

export const PAYMENT_TYPES: PaymentType[] = ['deposit', 'full', 'balance']

const toCents = (dollars: number) => Math.round(dollars * 100)

/** Deposit in dollars for a given total (e.g. 25% of $188 = $47.00). */
export const depositAmount = (total: number) =>
  Math.round((toCents(total) * DEPOSIT_PERCENT) / 100) / 100

/**
 * How much (in CENTS) should be charged for this payment type?
 * Returns null when that option isn't allowed for the booking's current state.
 *   deposit -> only if nothing paid yet
 *   full    -> only if nothing paid yet
 *   balance -> only if a deposit was already paid
 */
export function getChargeCents(type: PaymentType, total: number, alreadyPaid: number): number | null {
  const totalC = toCents(total)
  const paidC = toCents(alreadyPaid)
  if (totalC <= 0) return null

  if (type === 'deposit') return paidC === 0 ? Math.round((totalC * DEPOSIT_PERCENT) / 100) : null
  if (type === 'full')    return paidC === 0 ? totalC : null
  if (type === 'balance') return paidC > 0 && paidC < totalC ? totalC - paidC : null
  return null
}

export const money = (n: number) => `$${n.toFixed(2)}`

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  deposit_paid: 'Deposit paid',
  paid: 'Paid in full',
  refunded: 'Refunded',
}