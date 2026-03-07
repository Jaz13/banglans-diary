'use client'

import { useEffect } from 'react'
import { Guitar, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Guitar className="w-7 h-7" style={{ color: '#C2662D' }} />
          <span style={{ fontFamily: 'serif', fontSize: '1.5rem', color: '#C2662D' }}>Something went wrong</span>
        </div>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          The page ran into an error. Don&apos;t worry, your data is safe.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={reset}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', borderRadius: '0.75rem',
              backgroundColor: '#C2662D', color: 'white', border: 'none',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Try Again
          </button>
          <a
            href="/login"
            style={{ fontSize: '0.75rem', color: '#999' }}
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
