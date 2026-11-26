import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/employee-auth'

const sections = [
  {
    href: '/owner/employees',
    title: 'Employees',
    description: 'View, add, deactivate and assign roles to employee accounts.',
    icon: '👥',
    accent: 'violet',
  },
  {
    href: '/owner/bookings',
    title: 'Bookings',
    description: 'View all bookings, assign them to employees and update their status.',
    icon: '🗓️',
    accent: 'sky',
  },
  {
    href: '/owner/pricing',
    title: 'Content & Pricing',
    description: 'Update service tier prices and descriptions, and manage add-on services.',
    icon: '✨',
    accent: 'amber',
  },
  {
    href: '/owner/reviews',
    title: 'Reviews',
    description: 'See customer reviews, hide any from the website, and add testimonials.',
    icon: '⭐',
    accent: 'rose',
  },
]

export default async function OwnerDashboardPage() {
  const owner = await requireOwner()
  if (!owner) redirect('/owner-login')

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-violet-700">Business overview</p>
        <h1 className="text-3xl font-bold text-foreground">Owner Dashboard</h1>
        <p className="mt-1 text-text-muted">Welcome back, {owner.username}. Here&apos;s your command center.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {sections.map((s, index) => (
          <Link
            key={s.href}
            href={s.href}
            className={`dashboard-card dashboard-card--${s.accent} dashboard-enter block p-6`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="dashboard-card__icon mb-4" aria-hidden="true">{s.icon}</span>
            <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
              Open section <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
