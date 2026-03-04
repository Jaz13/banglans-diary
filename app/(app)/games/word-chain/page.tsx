'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function WordChainPage() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/games"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display tracking-wide">
            WORD CHAIN BATTLE
          </h1>
          <p className="text-sm text-muted-foreground">
            Each word starts with the last letter of the previous — think fast or lose
          </p>
        </div>
      </div>

      {/* Game iframe */}
      <div className="rock-card rounded-2xl overflow-hidden relative" style={{ minHeight: '700px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading Word Chain Battle...</p>
            </div>
          </div>
        )}
        <iframe
          src="https://web-production-4ddd8.up.railway.app"
          width="100%"
          height="700"
          style={{ border: 'none', borderRadius: '16px' }}
          allow="autoplay"
          title="Word Chain Battle"
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Back link */}
      <div className="text-center mt-6">
        <Link
          href="/games"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          Back to Games
        </Link>
      </div>
    </div>
  )
}
