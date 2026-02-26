'use client'

import { useState } from 'react'
import { Play, Square, Star, Trash2, Loader2, Gavel } from 'lucide-react'
import { ChallengeVoteCard } from './ChallengeVoteCard'
import type { SoundtrackSong } from '@/types'

interface SongCardProps {
  song: SoundtrackSong
  isAdmin: boolean
  onDelete: (id: string) => void
  onChallenge?: (songId: string) => Promise<void>
  onChallengeVote?: (songId: string, vote: boolean) => Promise<void>
  onPlay?: (song: SoundtrackSong) => void
  nowPlayingId?: string
}

export function SongCard({ song, isAdmin, onDelete, onChallenge, onChallengeVote, onPlay, nowPlayingId }: SongCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [challenging, setChallenging] = useState(false)

  const isPlaying = nowPlayingId === song.id
  const hasActiveChallenge = song.active_challenge && song.active_challenge.status === 'active'

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/soundtrack/${song.id}`, { method: 'DELETE' })
      onDelete(song.id)
    } catch { /* silent */ }
    setDeleting(false)
  }

  const handleChallenge = async () => {
    if (challenging || hasActiveChallenge) return
    setChallenging(true)
    try {
      await onChallenge?.(song.id)
    } catch { /* silent */ }
    setChallenging(false)
  }

  const handleChallengeVote = async (vote: boolean) => {
    await onChallengeVote?.(song.id, vote)
  }

  const thumbnailUrl = song.youtube_id
    ? `https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg`
    : null

  return (
    <div
      className={`group relative border rounded-xl transition-all duration-300 overflow-hidden ${
        isPlaying
          ? 'border-primary/50 bg-primary/8 shadow-[0_0_20px_oklch(0.75_0.17_68/0.15)] scale-[1.01]'
          : hasActiveChallenge
            ? 'border-primary/30 bg-primary/[0.03]'
            : song.is_signature
              ? 'border-primary/30 bg-primary/5 shadow-[0_0_12px_oklch(0.75_0.17_68/0.08)]'
              : 'border-border bg-card hover:border-border/80 hover:bg-card/80'
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
        {/* Album art / Track number */}
        <div className="relative shrink-0">
          {thumbnailUrl && !imgError ? (
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden relative cursor-pointer group/art ${
                isPlaying ? 'ring-2 ring-primary/60 shadow-[0_0_12px_oklch(0.75_0.17_68/0.3)]' : ''
              }`}
              onClick={() => song.youtube_id && onPlay?.(song)}
            >
              <img
                src={thumbnailUrl}
                alt={song.title}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isPlaying ? 'scale-110 brightness-75' : 'group-hover/art:scale-110 group-hover/art:brightness-90'
                }`}
                onError={() => setImgError(true)}
              />
              {/* Play overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  isPlaying ? 'bg-primary text-primary-foreground' : 'bg-black/60 text-white'
                }`}>
                  {isPlaying ? (
                    <div className="flex items-center gap-[2px]">
                      <span className="w-[3px] h-3 bg-primary-foreground rounded-full animate-[eq-bar_0.6s_ease-in-out_infinite]" />
                      <span className="w-[3px] h-4 bg-primary-foreground rounded-full animate-[eq-bar_0.6s_ease-in-out_infinite_0.2s]" />
                      <span className="w-[3px] h-2.5 bg-primary-foreground rounded-full animate-[eq-bar_0.6s_ease-in-out_infinite_0.4s]" />
                    </div>
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                song.is_signature
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground'
              } ${song.youtube_id ? 'hover:bg-primary/20 hover:text-primary' : ''}`}
              onClick={() => song.youtube_id && onPlay?.(song)}
            >
              {song.youtube_id ? (
                isPlaying ? (
                  <div className="flex items-center gap-[2px]">
                    <span className="w-[3px] h-3 bg-primary rounded-full animate-[eq-bar_0.6s_ease-in-out_infinite]" />
                    <span className="w-[3px] h-4 bg-primary rounded-full animate-[eq-bar_0.6s_ease-in-out_infinite_0.2s]" />
                    <span className="w-[3px] h-2.5 bg-primary rounded-full animate-[eq-bar_0.6s_ease-in-out_infinite_0.4s]" />
                  </div>
                ) : (
                  <Play className="w-4 h-4" />
                )
              ) : (
                <span className="text-xs font-mono opacity-60">
                  {String(song.position).padStart(2, '0')}
                </span>
              )}
            </div>
          )}

          {/* Signature star badge */}
          {song.is_signature && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow-md">
              <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
            </div>
          )}
        </div>

        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate leading-tight ${
            isPlaying ? 'text-primary' : song.is_signature ? 'text-primary' : 'text-foreground'
          }`}>
            {song.title}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {song.artist}{song.album ? ` \u00b7 ${song.album}` : ''}{song.year ? ` \u00b7 ${song.year}` : ''}
          </p>
          {song.note && (
            <p className="text-[11px] text-muted-foreground/50 italic truncate mt-0.5">
              &ldquo;{song.note}&rdquo;
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Challenge button — any member can nominate/challenge */}
          {!hasActiveChallenge && (
            <button
              onClick={handleChallenge}
              disabled={challenging}
              className={`p-1.5 rounded-lg transition-colors ${
                song.is_signature
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-muted-foreground/40 hover:text-primary hover:bg-primary/10'
              } opacity-0 group-hover:opacity-100 sm:opacity-100`}
              title={song.is_signature ? 'Challenge: remove from signature' : 'Nominate as signature track'}
            >
              {challenging ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : hasActiveChallenge ? (
                <Gavel className="w-3.5 h-3.5" />
              ) : (
                <Star className={`w-3.5 h-3.5 ${song.is_signature ? 'fill-primary' : ''}`} />
              )}
            </button>
          )}

          {/* Active challenge indicator */}
          {hasActiveChallenge && (
            <div className="p-1.5 text-primary" title="Vote on active challenge below">
              <Gavel className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Admin: delete */}
          {isAdmin && (
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${
                confirmDelete ? 'text-destructive bg-destructive/10' : 'text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10'
              } opacity-0 group-hover:opacity-100 sm:opacity-100`}
              title={confirmDelete ? 'Click again to confirm delete' : 'Delete track'}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Play button for mobile */}
          {song.youtube_id && (
            <button
              onClick={() => onPlay?.(song)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono border transition-all sm:hidden ${
                isPlaying
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-primary'
              }`}
            >
              {isPlaying ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Challenge voting card (inline below song row) */}
      {song.active_challenge && (
        <ChallengeVoteCard
          challenge={song.active_challenge}
          songTitle={song.title}
          isAdmin={isAdmin}
          onVote={handleChallengeVote}
        />
      )}
    </div>
  )
}
