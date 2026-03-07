'use client'

import { useEffect } from 'react'
import { Guitar, RefreshCw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Guitar className="w-7 h-7 text-primary" />
          <span className="font-rock text-2xl text-primary">OOPS</span>
        </div>
        <p className="text-foreground font-medium mb-2">Something went wrong</p>
        <p className="text-sm text-muted-foreground mb-6">
          Don&apos;t worry, your data is safe. Try refreshing.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/dashboard"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
