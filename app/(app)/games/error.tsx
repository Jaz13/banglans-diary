'use client'

import { useEffect } from 'react'
import { Gamepad2, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GamesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Game error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Gamepad2 className="w-7 h-7 text-primary" />
          <span className="font-rock text-2xl text-primary">GAME OVER</span>
        </div>
        <p className="text-foreground font-medium mb-2">Something went wrong</p>
        <p className="text-sm text-muted-foreground mb-6">
          The game ran into an error. Don&apos;t worry, no progress was lost.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Games
          </Link>
        </div>
      </div>
    </div>
  )
}
