'use client'

import { useState } from 'react'
import { BarChart3, CheckCircle2, Pin, Trash2, Lock } from 'lucide-react'
import type { Poll } from '@/types'

interface PollCardProps {
  poll: Poll
  isAdmin: boolean
  currentUserId: string
  onVote: (pollId: string, optionIndex: number) => void
  onDelete: (pollId: string) => void
  onPin: (pollId: string, pinned: boolean) => void
  onClose: (pollId: string, closed: boolean) => void
}

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getAvatarColor(id: string) {
  const colors = [
    'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-pink-500',
    'bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500',
    'bg-teal-500', 'bg-green-500', 'bg-lime-500', 'bg-yellow-500',
  ]
  let hash = 0
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return colors[Math.abs(hash) % colors.length]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function PollCard({ poll, isAdmin, currentUserId, onVote, onDelete, onPin, onClose }: PollCardProps) {
  const [voting, setVoting] = useState(false)
  const hasVoted = poll.user_vote !== null && poll.user_vote !== undefined
  const canSeeResults = hasVoted || poll.is_closed
  const maxVotes = Math.max(...(poll.option_votes || [0]))

  const handleVote = async (i: number) => {
    if (voting || poll.is_closed) return
    if (poll.user_vote === i) return // already voted this
    setVoting(true)
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: i }),
      })
      if (res.ok) onVote(poll.id, i)
    } catch { /* silent */ }
    setVoting(false)
  }

  const isOwner = poll.created_by === currentUserId

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all ${poll.is_pinned ? 'border-primary/30' : 'border-border'}`}>
      {/* Pinned bar */}
      {poll.is_pinned && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 flex items-center gap-1.5">
          <Pin className="w-3 h-3 text-primary fill-primary" />
          <span className="text-xs text-primary font-medium uppercase tracking-widest">Pinned</span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full ${getAvatarColor(poll.created_by)} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
              {getInitials(poll.creator?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-snug">
                {poll.question}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {poll.creator?.nickname || poll.creator?.full_name?.split(' ')[0]} · {timeAgo(poll.created_at)}
                {poll.is_closed && <span className="ml-2 text-destructive">· Closed</span>}
              </p>
            </div>
          </div>

          {/* Admin / owner actions */}
          {(isAdmin || isOwner) && (
            <div className="flex items-center gap-1 shrink-0">
              {isAdmin && (
                <>
                  <button
                    onClick={() => onClose(poll.id, !poll.is_closed)}
                    title={poll.is_closed ? 'Reopen poll' : 'Close poll'}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onPin(poll.id, !poll.is_pinned)}
                    title={poll.is_pinned ? 'Unpin' : 'Pin'}
                    className={`p-1.5 rounded-lg transition-colors ${poll.is_pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => onDelete(poll.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          {poll.options.map((option, i) => {
            const votes = poll.option_votes?.[i] ?? 0
            const pct = poll.total_votes > 0 ? Math.round((votes / poll.total_votes) * 100) : 0
            const isChosen = poll.user_vote === i
            const isLeading = canSeeResults && votes === maxVotes && maxVotes > 0

            return (
              <button
                key={i}
                onClick={() => handleVote(i)}
                disabled={poll.is_closed || voting}
                className={`w-full relative overflow-hidden rounded-xl border text-left transition-all duration-200 ${
                  isChosen
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary hover:border-primary/40 hover:bg-secondary/80'
                } ${poll.is_closed ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {/* Progress bar fill */}
                {canSeeResults && (
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-700 rounded-xl ${
                      isChosen ? 'bg-primary/20' : isLeading ? 'bg-accent/15' : 'bg-border/40'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                )}

                <div className="relative flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isChosen && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    <span className={`text-sm font-medium ${isChosen ? 'text-primary' : 'text-foreground'}`}>
                      {option}
                    </span>
                  </div>
                  {canSeeResults && (
                    <span className={`text-xs font-mono ${isLeading ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {pct}% · {votes}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}</span>
          </div>
          {!hasVoted && !poll.is_closed && (
            <span className="text-xs text-muted-foreground italic">tap to vote</span>
          )}
          {hasVoted && !poll.is_closed && (
            <span className="text-xs text-primary">✓ voted</span>
          )}
        </div>
      </div>
    </div>
  )
}
