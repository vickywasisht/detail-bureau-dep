import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Owner Sign In',
  description: 'Owner portal sign in for The Detail Bureau.',
  robots: { index: false, follow: false },
}

export default function OwnerLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
