import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create an Account',
  description: 'Create a Detail Bureau account to add your vehicles and book auto detailing services online.',
  robots: { index: false, follow: true },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
