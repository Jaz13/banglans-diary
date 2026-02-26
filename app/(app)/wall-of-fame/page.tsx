'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Plus, Flame } from 'lucide-react'
import { FameCard } from '@/components/wall-of-fame/FameCard'
import { NominateModal } from '@/components/wall-of-fame/NominateModal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { WallEntry } from '@/types'

const CATEGORIES = [
  { value: 'all',     label: 'ALL' },
  { value: 'moment',  label: '🏆 MOMENT' },
  { value: 'hostel',  label: '🏫 HOSTEL' },
  { value: 'cricket', label: '🏏 CRICKET' },
  { value: 'music',   label: '🎵 MUSIC' },
  { value: 'quote',   label: '💬 QUOTE' },
  { value: 'trip',    label: '✈️ TRIP' },
]

export default function WallOfFamePage() {
  const { user, isAdmin } = useAuth()
  const [entries, setEntries] = useState<WallEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showNominate, setShowNominate] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/wall-of-fame')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setEntries(data)
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleVote = (id: string, wasVoted: boolean) => {
    setEntries(prev => prev.map(e => e.id === id
      ? { ...e, vote_count: wasVoted ? e.vote_count - 1 : e.vote_count + 1, user_has_voted: !wasVoted }
      : e
    ))
  }

  const handlePin = (id: string, pinned: boolean) => {
    setEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, is_pinned: pinned } : e)
      return [...updated].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return b.vote_count - a.vote_count
      })
    })
  }

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.category === filter)

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            WALL OF FAME
          </h1>
          <div className="rock-divider mb-3" />
          <p className="text-muted-foreground">
            The legendary moments that define the Banglans 🔥
          </p>
        </div>
        <button
          onClick={() => setShowNominate(true)}
          className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">Nominate</span>
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
              filter === cat.value
                ? 'bg-primary/15 text-primary border-primary/40'
                : 'bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rock divider */}
      <div className="rock-divider mb-6" />

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-secondary animate-pulse h-56"
              style={{ animationDelay: `${i * 100}ms`, animationDuration: '1.2s' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-wide" style={{ fontFamily: 'var(--font-rock)' }}>
            {filter === 'all' ? 'THE WALL AWAITS' : `NO ${filter.toUpperCase()} LEGENDS YET`}
          </h2>
          <p className="text-muted-foreground mb-6">
            {filter === 'all'
              ? 'Every group has legends. Nominate the first one.'
              : 'Try a different category or nominate one.'}
          </p>
          <button
            onClick={() => setShowNominate(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <Flame className="w-4 h-4" />
            Nominate a Legend
          </button>
        </div>
      )}

      {/* Entries grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((entry, i) => (
            <div
              key={entry.id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-400"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: 'both' }}
            >
              <FameCard
                entry={entry}
                isAdmin={isAdmin}
                currentUserId={user?.id || ''}
                onVote={handleVote}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Nominate modal */}
      {showNominate && (
        <NominateModal
          onClose={() => setShowNominate(false)}
          onCreated={load}
        />
      )}
    </>
  )
}
