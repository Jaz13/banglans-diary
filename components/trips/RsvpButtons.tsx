'use client'

import { useState } from 'react'
import { Check, HelpCircle, X } from 'lucide-react'

interface RsvpButtonsProps {
  currentStatus?: 'going' | 'maybe' | 'not_going' | null
  tripId: string
  onUpdate: (status: 'going' | 'maybe' | 'not_going') => void
}

export function RsvpButtons({ currentStatus, tripId, onUpdate }: RsvpButtonsProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async (status: 'going' | 'maybe' | 'not_going') => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) onUpdate(status)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleClick('going')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          currentStatus === 'going'
            ? 'bg-accent text-white shadow-[0_0_12px_oklch(0.62_0.14_148/0.4)]'
            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        }`}
      >
        <Check className="w-3.5 h-3.5" />
        Going
      </button>
      <button
        onClick={() => handleClick('maybe')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          currentStatus === 'maybe'
            ? 'bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.75_0.17_68/0.4)]'
            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        }`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Maybe
      </button>
      <button
        onClick={() => handleClick('not_going')}
        disabled={loading}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          currentStatus === 'not_going'
            ? 'bg-destructive text-white'
            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        }`}
      >
        <X className="w-3.5 h-3.5" />
        Can&apos;t go
      </button>
    </div>
  )
}
