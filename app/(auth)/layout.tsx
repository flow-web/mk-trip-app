export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper dark:bg-paper-dark flex items-center justify-center p-6">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
