'use client'

import { useState } from 'react'
import { Flame, Pin, Trophy, Music, Plane, School, CircleDot, Quote, Trash2, Loader2 } from 'lucide-react'
import { playLikeSound, playUnlikeSound } from '@/lib/sounds'
import type { WallEntry } from '@/types'

interface FameCardProps {
  entry: WallEntry
  isAdmin: boolean
  currentUserId: string
  onVote: (id: string, hasVoted: boolean) => void
  onPin: (id: string, pinned: boolean) => void
  onDelete: (id: string) => void
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  moment:  { label: 'MOMENT',  icon: Trophy,     color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  quote:   { label: 'QUOTE',   icon: Quote,      color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  trip:    { label: 'TRIP',    icon: Plane,      color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
  hostel:  { label: 'HOSTEL',  icon: School,     color: 'text-green-400 bg-green-400/10 border-green-400/30' },
  cricket: { label: 'CRICKET', icon: CircleDot,  color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  music:   { label: 'MUSIC',   icon: Music,      color: 'text-pink-400 bg-pink-400/10 border-pink-400/30' },
}

export function FameCard({ entry, isAdmin, currentUserId, onVote, onPin, onDelete }: FameCardProps) {
  const [voting, setVoting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cat = CATEGORY_CONFIG[entry.category] ?? CATEGORY_CONFIG.moment
  const CatIcon = cat.icon

  const handleVote = async () => {
    if (voting) return
    setVoting(true)
    try {
      const method = entry.user_has_voted ? 'DELETE' : 'POST'
      const res = await fetch(`/api/wall-of-fame/${entry.id}/vote`, { method })
      if (res.ok) {
        if (entry.user_has_voted) {
          playUnlikeSound()
        } else {
          playLikeSound()
        }
        onVote(entry.id, entry.user_has_voted ?? false)
      }
    } catch { /* silent */ }
    setVoting(false)
  }

  const handlePin = async () => {
    try {
      await fetch(`/api/wall-of-fame/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !entry.is_pinned }),
      })
      onPin(entry.id, !entry.is_pinned)
    } catch { /* silent */ }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/wall-of-fame/${entry.id}`, { method: 'DELETE' })
      onDelete(entry.id)
    } catch { /* silent */ }
    setDeleting(false)
  }

  const submitterName = entry.submitter?.full_name ?? 'A Banglan'

  return (
    <div className={`relative bg-card border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_oklch(0.75_0.17_68/0.12)] ${
      entry.is_pinned ? 'border-primary/40 shadow-[0_0_12px_oklch(0.75_0.17_68/0.15)]' : 'border-border'
    }`}>
      {/* Pinned badge */}
      {entry.is_pinned && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-primary/20 border border-primary/40 rounded-full px-2 py-0.5">
          <Pin className="w-2.5 h-2.5 text-primary" />
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">Pinned</span>
        </div>
      )}

      {/* Photo (if any) */}
      {entry.photo_url && (
        <div className="relative h-44 bg-secondary overflow-hidden">
          <img src={entry.photo_url} alt={entry.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <div className="p-5">
        {/* Category + era */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest border rounded-full px-2.5 py-1 ${cat.color}`}>
            <CatIcon className="w-3 h-3" />
            {cat.label}
          </span>
          {entry.era && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {entry.era}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground mb-2 leading-tight" style={{ fontFamily: 'var(--font-rock)' }}>
          {entry.title}
        </h3>

        {/* Story */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 mb-4">
          {entry.story}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Fire vote button */}
            <button
              onClick={handleVote}
              disabled={voting}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all border ${
                entry.user_has_voted
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                  : 'bg-secondary border-border text-muted-foreground hover:border-orange-500/40 hover:text-orange-400'
              }`}
            >
              {voting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Flame className={`w-3.5 h-3.5 ${entry.user_has_voted ? 'fill-orange-400' : ''}`} />
              )}
              <span className="font-mono">{entry.vote_count}</span>
            </button>

            {/* Submitter */}
            <span className="text-xs text-muted-foreground/60">
              by {submitterName}
            </span>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePin}
                className={`p-1.5 rounded-lg transition-colors ${
                  entry.is_pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
                title={entry.is_pinned ? 'Unpin' : 'Pin to top'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition-colors ${
                  confirmDelete ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                }`}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete entry'}
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
