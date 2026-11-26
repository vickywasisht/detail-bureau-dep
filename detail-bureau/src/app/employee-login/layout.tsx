import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Employee Sign In',
  description: 'Employee portal sign in for The Detail Bureau staff.',
  robots: { index: false, follow: false },
}

export default function EmployeeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
