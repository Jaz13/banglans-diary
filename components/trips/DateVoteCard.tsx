'use client'

import { useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import type { ProposedDate } from '@/types'

interface DateVoteCardProps {
  proposedDate: ProposedDate
  dateIndex: number
  tripId: string
  currentUserId: string
  onVote: (dateIndex: number, userId: string) => void
}

export function DateVoteCard({ proposedDate, dateIndex, tripId, currentUserId, onVote }: DateVoteCardProps) {
  const [loading, setLoading] = useState(false)
  const hasVoted = proposedDate.votes?.includes(currentUserId) ?? false
  const voteCount = proposedDate.votes?.length ?? 0

  const handleVote = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote_date', dateIndex, userId: currentUserId }),
      })
      if (res.ok) onVote(dateIndex, currentUserId)
    } finally {
      setLoading(false)
    }
  }

  const startDate = proposedDate.start ? new Date(proposedDate.start) : null
  const endDate = proposedDate.end ? new Date(proposedDate.end) : null

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
      hasVoted ? 'border-primary/40 bg-primary/5' : 'border-border bg-secondary/50'
    }`}>
      <div>
        <p className="text-sm font-semibold text-foreground">{proposedDate.label}</p>
        {startDate && (
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {format(startDate, 'MMM d')}
            {endDate && endDate.getTime() !== startDate.getTime() ? ` – ${format(endDate, 'MMM d, yyyy')}` : `, ${format(startDate, 'yyyy')}`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-bold font-mono ${hasVoted ? 'text-primary' : 'text-muted-foreground'}`}>
          {voteCount} vote{voteCount !== 1 ? 's' : ''}
        </span>
        <button
          onClick={handleVote}
          disabled={loading}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
            hasVoted
              ? 'bg-primary text-primary-foreground shadow-[0_0_10px_oklch(0.75_0.17_68/0.3)]'
              : 'bg-secondary border border-border text-muted-foreground hover:text-primary hover:border-primary/40'
          }`}
        >
          <ChevronUp className="w-3.5 h-3.5" />
          {hasVoted ? 'Voted' : 'Vote'}
        </button>
      </div>
    </div>
  )
}
