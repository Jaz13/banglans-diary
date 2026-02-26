'use client'

import { useState } from 'react'
import { X, SkipBack, SkipForward, Music, ChevronDown } from 'lucide-react'
import { YouTubeEmbed } from './YouTubeEmbed'
import type { SoundtrackSong } from '@/types'

interface NowPlayingProps {
  song: SoundtrackSong
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
  onEnded?: () => void
}

export function NowPlaying({ song, onClose, onNext, onPrev, hasNext, hasPrev, onEnded }: NowPlayingProps) {
  const [minimized, setMinimized] = useState(false)
  const [imgError, setImgError] = useState(false)

  const thumbnailUrl = song.youtube_id
    ? `https://img.youtube.com/vi/${song.youtube_id}/hqdefault.jpg`
    : null

  // Minimized bar at bottom
  if (minimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:bottom-0 sm:px-4 sm:pb-2">
        <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-xl border border-primary/30 rounded-t-2xl sm:rounded-2xl shadow-[0_-4px_30px_oklch(0.75_0.17_68/0.15)] overflow-hidden">
          {/* Animated progress line */}
          <div className="h-[2px] bg-secondary overflow-hidden">
            <div className="h-full bg-primary animate-[progress-slide_3s_ease-in-out_infinite] w-1/3" />
          </div>
          <div className="flex items-center gap-3 px-4 py-2.5">
            {/* Thumbnail */}
            {thumbnailUrl && !imgError ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-primary/30">
                <img src={thumbnailUrl} alt={song.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Music className="w-5 h-5 text-primary" />
              </div>
            )}

            {/* Song info */}
            <div className="flex-1 min-w-0" onClick={() => setMinimized(false)}>
              <p className="text-sm font-semibold text-primary truncate">{song.title}</p>
              <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
            </div>

            {/* Equalizer bars */}
            <div className="flex items-end gap-[2px] h-4 mr-1">
              {[0, 0.15, 0.3, 0.1, 0.25].map((delay, i) => (
                <span
                  key={i}
                  className="w-[3px] bg-primary rounded-full animate-[eq-bar_0.8s_ease-in-out_infinite]"
                  style={{
                    animationDelay: `${delay}s`,
                    height: `${8 + (i % 3) * 4}px`,
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {hasPrev && (
                <button onClick={onPrev} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <SkipBack className="w-4 h-4" />
                </button>
              )}
              {hasNext && (
                <button onClick={onNext} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Full player
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background artwork blur */}
      {thumbnailUrl && !imgError && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-125 opacity-20"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>
      )}

      {/* Top bar — fixed, not scrollable */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2 safe-area-top max-w-2xl w-full mx-auto">
        <button
          onClick={() => setMinimized(true)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
          <span className="font-mono text-xs uppercase tracking-widest">Now Playing</span>
        </button>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content — ensures YouTube player is always reachable */}
      <div className="relative flex-1 overflow-y-auto max-w-2xl w-full mx-auto">
        {/* Album art + info */}
        <div className="flex flex-col items-center px-6 py-4 gap-5">
          {/* Album artwork with vinyl effect — smaller to leave room for video */}
          <div className="relative w-full max-w-[260px] sm:max-w-xs aspect-square">
            {/* Vinyl record behind artwork */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[95%] h-[95%] rounded-full bg-[#111] shadow-2xl animate-[vinyl-spin_4s_linear_infinite] relative">
                <div className="absolute inset-[15%] rounded-full border border-white/5" />
                <div className="absolute inset-[25%] rounded-full border border-white/5" />
                <div className="absolute inset-[35%] rounded-full border border-white/5" />
                <div className="absolute inset-[20%] rounded-full border border-white/[0.03]" />
                <div className="absolute inset-[30%] rounded-full border border-white/[0.03]" />
                <div className="absolute inset-[38%] rounded-full bg-primary/30 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-black/60" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 via-transparent to-transparent" />
              </div>
            </div>

            {/* Square artwork overlaid */}
            {thumbnailUrl && !imgError ? (
              <div className="absolute inset-[12%] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                <img src={thumbnailUrl} alt={song.title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
              </div>
            ) : (
              <div className="absolute inset-[12%] rounded-2xl bg-card border border-border flex items-center justify-center shadow-2xl">
                <Music className="w-16 h-16 text-primary/40" />
              </div>
            )}

            <div className="absolute inset-[10%] rounded-2xl bg-primary/10 blur-2xl -z-10" />
          </div>

          {/* Song details */}
          <div className="text-center px-4 max-w-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 leading-tight">
              {song.title}
            </h2>
            <p className="text-sm text-primary font-medium">
              {song.artist}
            </p>
            {song.album && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {song.album}{song.year ? ` \u00b7 ${song.year}` : ''}
              </p>
            )}
            {song.note && (
              <p className="text-xs text-muted-foreground/60 italic mt-2">
                &ldquo;{song.note}&rdquo;
              </p>
            )}
          </div>

          {/* Equalizer visualization */}
          <div className="flex items-end justify-center gap-[3px] h-6">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="w-[3px] bg-primary/60 rounded-full animate-[eq-bar_0.8s_ease-in-out_infinite]"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  height: `${6 + Math.sin(i * 0.8) * 12 + 10}px`,
                }}
              />
            ))}
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="p-3 rounded-full text-foreground hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-3 rounded-full text-foreground hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* YouTube player — fully visible with padding */}
          {song.youtube_id && (
            <div className="w-full px-0 pb-6">
              <div className="rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <YouTubeEmbed videoId={song.youtube_id} title={`${song.title} — ${song.artist}`} onEnded={onEnded} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
