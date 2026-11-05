export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-2xl font-semibold text-black tracking-widest uppercase">
            The Detail Bureau
          </p>
          <p className="text-gray-600 text-sm mt-1">Professional Auto Detailing</p>
        </div>
        {children}
      </div>
    </main>
  )
}