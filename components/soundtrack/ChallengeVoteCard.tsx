'use client'

import { useState } from 'react'
import { Check, X, Clock, Loader2, Gavel, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SignatureChallenge } from '@/types'

interface ChallengeVoteCardProps {
  challenge: SignatureChallenge
  songTitle: string
  isAdmin: boolean
  onVote: (vote: boolean) => Promise<void>
}

export function ChallengeVoteCard({ challenge, songTitle, isAdmin, onVote }: ChallengeVoteCardProps) {
  const [voting, setVoting] = useState(false)

  const handleVote = async (vote: boolean) => {
    if (voting || challenge.status !== 'active') return
    if (challenge.current_user_vote === vote) return // same vote
    setVoting(true)
    try {
      await onVote(vote)
    } catch { /* silent */ }
    setVoting(false)
  }

  const isResolved = challenge.status !== 'active'
  const hasVoted = challenge.current_user_vote !== null && challenge.current_user_vote !== undefined
  const pctAgree = challenge.total_votes > 0
    ? Math.round((challenge.agree_count / challenge.total_votes) * 100)
    : 0
  const pctBar = challenge.total_admins > 0
    ? Math.round((challenge.agree_count / challenge.total_admins) * 100)
    : 0

  const timeLeft = challenge.expires_at
    ? formatDistanceToNow(new Date(challenge.expires_at), { addSuffix: false })
    : ''

  const challengerName = challenge.challenger?.nickname || challenge.challenger?.full_name || 'A Banglan'
  const actionText = challenge.challenge_type === 'add'
    ? 'Make this a signature track?'
    : 'Remove from signature tracks?'

  // Resolved state
  if (isResolved) {
    const isApproved = challenge.result === 'approved'
    const isExpired = challenge.status === 'expired'
    return (
      <div className={`mx-4 mb-3 px-3 py-2 rounded-lg border text-xs ${
        isApproved
          ? 'bg-accent/8 border-accent/20 text-accent'
          : 'bg-muted/50 border-border text-muted-foreground'
      }`}>
        <div className="flex items-center gap-1.5">
          {isApproved ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : isExpired ? (
            <Timer className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="font-medium">
            {isApproved
              ? `Challenge approved — ${challenge.challenge_type === 'add' ? 'added to' : 'removed from'} signature tracks`
              : isExpired
                ? 'Challenge expired — not enough votes'
                : 'Challenge rejected — majority disagreed'
            }
          </span>
          <span className="ml-auto opacity-60">
            {challenge.agree_count}/{challenge.total_admins} agreed
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-3 mb-3 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden animate-in slide-in-from-top-1 duration-200">
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start gap-2">
          <Gavel className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary leading-tight">
              {actionText}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Challenged by {challengerName} · {formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 shrink-0">
            <Clock className="w-3 h-3" />
            <span>{timeLeft} left</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-3 mb-2">
        <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
          {/* Agree fill */}
          <div
            className="absolute inset-y-0 left-0 bg-primary/80 rounded-full transition-all duration-500"
            style={{ width: `${pctBar}%` }}
          />
          {/* Threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-[2px] bg-foreground/30"
            style={{ left: `${Math.round((challenge.threshold / challenge.total_admins) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-muted-foreground font-mono">
            {challenge.agree_count} agree · {challenge.disagree_count} disagree · {challenge.total_votes}/{challenge.total_admins} voted
          </p>
          <p className="text-[10px] text-muted-foreground/60 font-mono">
            need {challenge.threshold}
          </p>
        </div>
      </div>

      {/* Vote buttons (admin only) or waiting message (members) */}
      {isAdmin ? (
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={() => handleVote(true)}
            disabled={voting}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              challenge.current_user_vote === true
                ? 'bg-primary text-primary-foreground shadow-[0_0_8px_oklch(0.75_0.17_68/0.3)]'
                : 'bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border'
            }`}
          >
            {voting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Agree
              </>
            )}
          </button>
          <button
            onClick={() => handleVote(false)}
            disabled={voting}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              challenge.current_user_vote === false
                ? 'bg-destructive/80 text-white'
                : 'bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border'
            }`}
          >
            {voting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <X className="w-3.5 h-3.5" />
                Disagree
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-muted-foreground/60 text-center italic">
            Waiting for admin votes to decide
          </p>
        </div>
      )}
    </div>
  )
}
