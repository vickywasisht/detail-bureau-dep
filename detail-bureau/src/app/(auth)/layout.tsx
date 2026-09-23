export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-black tracking-widest uppercase">
            The Detail Bureau
          </h1>
          <p className="text-gray-600 text-sm mt-1">Professional Auto Detailing</p>
        </div>
        {children}
      </div>
    </div>
  )
}