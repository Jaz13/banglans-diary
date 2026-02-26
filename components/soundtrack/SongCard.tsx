'use client'

import { useState } from 'react'
import { Play, Square, Star, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { YouTubeEmbed } from './YouTubeEmbed'
import type { SoundtrackSong } from '@/types'

interface SongCardProps {
  song: SoundtrackSong
  isAdmin: boolean
  onDelete: (id: string) => void
  onToggleSignature?: (id: string, value: boolean) => void
}

export function SongCard({ song, isAdmin, onDelete, onToggleSignature }: SongCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/soundtrack/${song.id}`, { method: 'DELETE' })
      onDelete(song.id)
    } catch { /* silent */ }
    setDeleting(false)
  }

  const handleToggleSignature = async () => {
    try {
      await fetch(`/api/soundtrack/${song.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_signature: !song.is_signature }),
      })
      onToggleSignature?.(song.id, !song.is_signature)
    } catch { /* silent */ }
  }

  return (
    <div className={`border rounded-xl transition-all duration-200 overflow-hidden ${
      song.is_signature
        ? 'border-primary/30 bg-primary/5 shadow-[0_0_12px_oklch(0.75_0.17_68/0.1)]'
        : 'border-border bg-card hover:border-border/80'
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Track number */}
        <span className="text-xs font-mono text-muted-foreground/60 w-7 text-right shrink-0">
          {String(song.position).padStart(2, '0')}
        </span>

        {/* Signature star */}
        {song.is_signature && (
          <Star className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
        )}

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${song.is_signature ? 'text-primary' : 'text-foreground'}`}>
            {song.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {song.artist}{song.album ? ` — ${song.album}` : ''}{song.year ? ` (${song.year})` : ''}
          </p>
          {song.note && (
            <p className="text-xs text-muted-foreground/60 italic truncate mt-0.5">"{song.note}"</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Admin: toggle signature */}
          {isAdmin && (
            <button
              onClick={handleToggleSignature}
              className={`p-1.5 rounded-lg transition-colors ${
                song.is_signature ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
              title={song.is_signature ? 'Remove signature' : 'Mark as signature track'}
            >
              <Star className={`w-3.5 h-3.5 ${song.is_signature ? 'fill-primary' : ''}`} />
            </button>
          )}

          {/* Admin: delete */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${
                confirmDelete ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
              }`}
              title={confirmDelete ? 'Click again to confirm delete' : 'Delete track'}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* YouTube play toggle (only if youtube_id exists) */}
          {song.youtube_id && (
            <button
              onClick={() => setExpanded(v => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
                expanded
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-primary'
              }`}
            >
              {expanded ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {expanded ? 'Stop' : 'Play'}
              {expanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}
        </div>
      </div>

      {/* YouTube embed (accordion) */}
      {expanded && song.youtube_id && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
          <YouTubeEmbed videoId={song.youtube_id} title={`${song.title} — ${song.artist}`} />
        </div>
      )}
    </div>
  )
}
