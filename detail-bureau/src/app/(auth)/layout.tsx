import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-semibold text-foreground tracking-widest uppercase transition-colors hover:text-violet-700">
            The Detail Bureau
          </Link>
          <p className="text-text-muted text-sm mt-1">Professional Auto Detailing</p>
        </div>
        {children}
      </div>
    </main>
  )
}