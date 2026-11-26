import { PAYMENT_LABELS, type PaymentStatus } from '@/lib/payments'

const BOOKING_STATUSES: Record<string, { label: string; variant: string }> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'teal' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
}

const PAYMENT_VARIANTS: Record<PaymentStatus, string> = {
  unpaid: 'warning',
  deposit_paid: 'purple',
  paid: 'success',
  refunded: 'neutral',
}

export function BookingStatusBadge({ status }: { status: string }) {
  const config = BOOKING_STATUSES[status] ?? {
    label: status.replace(/_/g, ' '),
    variant: 'neutral',
  }

  return <span className={`ui-badge ui-badge--${config.variant}`}>{config.label}</span>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`ui-badge ui-badge--${PAYMENT_VARIANTS[status]}`}>
      {PAYMENT_LABELS[status]}
    </span>
  )
}
