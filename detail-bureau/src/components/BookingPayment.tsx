import PayButton from '@/components/PayButton'
import { PAYMENT_LABELS, depositAmount, getChargeCents, money, DEPOSIT_PERCENT, type PaymentStatus } from '@/lib/payments'

const BADGE: Record<PaymentStatus, string> = {
  unpaid: 'bg-gray-100 text-gray-600 border border-gray-200',
  deposit_paid: 'bg-blue-50 text-blue-700 border border-blue-200',
  paid: 'bg-green-50 text-green-700 border border-green-200',
  refunded: 'bg-red-50 text-red-700 border border-red-200',
}

// Shows the payment status of a booking plus the pay buttons that apply to it.
export default function BookingPayment({
  bookingId, total, amountPaid, status,
}: { bookingId: string; total: number; amountPaid: number; status: PaymentStatus }) {
  const canDeposit = getChargeCents('deposit', total, amountPaid) !== null
  const canFull    = getChargeCents('full', total, amountPaid) !== null
  const balanceC   = getChargeCents('balance', total, amountPaid)

  return (
    <div className="mt-3 border-t border-gray-200 pt-3 flex flex-wrap items-center gap-3">
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE[status]}`}>{PAYMENT_LABELS[status]}</span>
      {amountPaid > 0 && (
        <span className="text-xs text-gray-600">{money(amountPaid)} of {money(total)} paid</span>
      )}
      {canDeposit && (
        <PayButton bookingId={bookingId} type="deposit" label={`Pay ${DEPOSIT_PERCENT}% deposit (${money(depositAmount(total))})`} primary />
      )}
      {canFull && <PayButton bookingId={bookingId} type="full" label={`Pay in full (${money(total)})`} />}
      {balanceC !== null && (
        <PayButton bookingId={bookingId} type="balance" label={`Pay balance (${money(balanceC / 100)})`} primary />
      )}
    </div>
  )
}