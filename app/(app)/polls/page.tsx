'use client'

import { useState, useEffect, useCallback } from 'react'
import { BarChart3, Plus } from 'lucide-react'
import { CreatePollModal } from '@/components/polls/CreatePollModal'
import { PollCard } from '@/components/polls/PollCard'
import { useAuth } from '@/components/providers/AuthProvider'
import type { Poll } from '@/types'

export default function PollsPage() {
  const { user, isAdmin } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/polls')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setPolls(data)
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleVote = (pollId: string, optionIndex: number) => {
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p
      const prevVote = p.user_vote
      const newOptionVotes = [...(p.option_votes || p.options.map(() => 0))]

      // Remove previous vote count
      if (prevVote !== null && prevVote !== undefined) {
        newOptionVotes[prevVote] = Math.max(0, newOptionVotes[prevVote] - 1)
      }
      newOptionVotes[optionIndex] = (newOptionVotes[optionIndex] || 0) + 1

      return {
        ...p,
        user_vote: optionIndex,
        option_votes: newOptionVotes,
        total_votes: prevVote !== null && prevVote !== undefined ? p.total_votes : p.total_votes + 1,
      }
    }))
  }

  const handleDelete = async (pollId: string) => {
    const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' })
    if (res.ok) setPolls(prev => prev.filter(p => p.id !== pollId))
  }

  const handlePin = async (pollId: string, pinned: boolean) => {
    const res = await fetch(`/api/polls/${pollId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: pinned }),
    })
    if (res.ok) {
      setPolls(prev => {
        const updated = prev.map(p => p.id === pollId ? { ...p, is_pinned: pinned } : p)
        return [...updated].sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1
          if (!a.is_pinned && b.is_pinned) return 1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      })
    }
  }

  const handleClose = async (pollId: string, closed: boolean) => {
    const res = await fetch(`/api/polls/${pollId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_closed: closed }),
    })
    if (res.ok) setPolls(prev => prev.map(p => p.id === pollId ? { ...p, is_closed: closed } : p))
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            POLLS
          </h1>
          <div className="rock-divider mb-3" />
          <p className="text-muted-foreground">Quick votes for the group 🗳️</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">New Poll</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-secondary animate-pulse h-40"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && polls.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <h2
            className="text-2xl font-bold text-foreground mb-2 tracking-wide"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            NO POLLS YET
          </h2>
          <p className="text-muted-foreground mb-6">
            Ask the group something. Kerala trip, next destination, anything.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <BarChart3 className="w-4 h-4" />
            Create First Poll
          </button>
        </div>
      )}

      {/* Polls list */}
      {!loading && polls.length > 0 && (
        <div className="space-y-4 max-w-2xl">
          {polls.map(poll => (
            <PollCard
              key={poll.id}
              poll={poll}
              isAdmin={isAdmin}
              currentUserId={user?.id || ''}
              onVote={handleVote}
              onDelete={handleDelete}
              onPin={handlePin}
              onClose={handleClose}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </>
  )
}
