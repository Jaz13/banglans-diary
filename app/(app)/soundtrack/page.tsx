'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Music, Plus, Star, Disc3, ListMusic, Users } from 'lucide-react'
import { SongCard } from '@/components/soundtrack/SongCard'
import { NowPlaying } from '@/components/soundtrack/NowPlaying'
import { AddSongModal } from '@/components/soundtrack/AddSongModal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { SoundtrackSong } from '@/types'

export default function SoundtrackPage() {
  const { isAdmin } = useAuth()
  const [songs, setSongs] = useState<SoundtrackSong[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<SoundtrackSong | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/soundtrack')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setSongs(data)
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id))
    if (nowPlaying?.id === id) setNowPlaying(null)
  }

  const handleChallenge = async (songId: string) => {
    try {
      const res = await fetch(`/api/soundtrack/${songId}/challenge`, { method: 'POST' })
      if (res.ok) {
        // Reload to get fresh challenge data
        await load()
      }
    } catch { /* silent */ }
  }

  const handleChallengeVote = async (songId: string, vote: boolean) => {
    try {
      const res = await fetch(`/api/soundtrack/${songId}/challenge/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      })
      if (res.ok) {
        const result = await res.json()
        // Update song in-place with new challenge data
        setSongs(prev => prev.map(s => {
          if (s.id !== songId || !s.active_challenge) return s
          const updatedChallenge = {
            ...s.active_challenge,
            agree_count: result.agree_count,
            disagree_count: result.disagree_count,
            total_votes: result.total_votes,
            current_user_vote: result.current_user_vote,
            status: result.status,
            result: result.result,
          }
          const updatedSong = { ...s, active_challenge: updatedChallenge }
          // If challenge was approved, flip is_signature
          if (result.status === 'resolved' && result.result === 'approved') {
            updatedSong.is_signature = s.active_challenge.challenge_type === 'add'
          }
          return updatedSong
        }))
        // If resolved, reload after a brief delay to clean up
        if (result.status === 'resolved') {
          setTimeout(() => load(), 1500)
        }
      }
    } catch { /* silent */ }
  }

  const handlePlay = (song: SoundtrackSong) => {
    if (nowPlaying?.id === song.id) {
      setNowPlaying(null)
    } else {
      setNowPlaying(song)
    }
  }

  const playableSongs = useMemo(() => songs.filter(s => s.youtube_id), [songs])

  const handleNext = () => {
    if (!nowPlaying) return
    const idx = playableSongs.findIndex(s => s.id === nowPlaying.id)
    if (idx < playableSongs.length - 1) setNowPlaying(playableSongs[idx + 1])
  }

  const handlePrev = () => {
    if (!nowPlaying) return
    const idx = playableSongs.findIndex(s => s.id === nowPlaying.id)
    if (idx > 0) setNowPlaying(playableSongs[idx - 1])
  }

  const signatureSongs = songs.filter(s => s.is_signature)
  const regularSongs = songs.filter(s => !s.is_signature)

  // Stats
  const uniqueArtists = new Set(songs.map(s => s.artist)).size
  const uniqueDecades = new Set(songs.filter(s => s.year).map(s => `${Math.floor(s.year! / 10) * 10}s`))

  return (
    <>
      {/* ── Hero Header ───────────────────────────────────── */}
      <div className="relative mb-8 overflow-hidden">
        {/* Background vinyl decoration */}
        <div className="absolute -right-16 -top-16 w-48 h-48 opacity-[0.04] pointer-events-none">
          <div className="w-full h-full rounded-full border-[3px] border-foreground animate-[vinyl-spin_8s_linear_infinite]">
            <div className="absolute inset-[25%] rounded-full border border-foreground" />
            <div className="absolute inset-[40%] rounded-full bg-foreground/20" />
          </div>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-primary animate-[vinyl-spin_4s_linear_infinite]" />
              </div>
              <h1
                className="text-4xl sm:text-5xl font-bold text-primary tracking-wide neon-flicker"
                style={{ fontFamily: 'var(--font-rock)' }}
              >
                THE MIXTAPE
              </h1>
            </div>
            <div className="rock-divider mb-3" />
            <p className="text-muted-foreground text-sm">
              The soundtrack of our lives 🎸
            </p>

            {/* Stats row */}
            {!loading && songs.length > 0 && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <ListMusic className="w-3.5 h-3.5" />
                  <span className="font-mono">{songs.length}</span>
                  <span>tracks</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-mono">{uniqueArtists}</span>
                  <span>artists</span>
                </div>
                {uniqueDecades.size > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Music className="w-3.5 h-3.5" />
                    <span>{Array.from(uniqueDecades).sort().join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors uppercase tracking-widest amber-glow"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Add Track</span>
          </button>
        </div>
      </div>

      {/* ── Loading skeletons ────────────────────────────── */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-secondary animate-pulse flex items-center gap-3 px-4 py-3"
              style={{ animationDelay: `${i * 80}ms`, animationDuration: '1.2s' }}
            >
              <div className="w-12 h-12 rounded-lg bg-muted/30 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted/30 rounded w-2/3" />
                <div className="h-2.5 bg-muted/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────── */}
      {!loading && songs.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Vinyl record */}
            <div className="w-24 h-24 rounded-full bg-[#111] border border-white/5 animate-[vinyl-spin_4s_linear_infinite]">
              <div className="absolute inset-[25%] rounded-full border border-white/5" />
              <div className="absolute inset-[35%] rounded-full border border-white/5" />
              <div className="absolute inset-[42%] rounded-full bg-primary/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-black/60" />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/15 blur-xl" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-wide" style={{ fontFamily: 'var(--font-rock)' }}>
            THE MIXTAPE IS EMPTY
          </h2>
          <p className="text-muted-foreground mb-6">
            Every legend needs a soundtrack. Add the first track.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors uppercase tracking-widest amber-glow"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <Music className="w-4 h-4" />
            Add First Track
          </button>
        </div>
      )}

      {/* ── Signature tracks ─────────────────────────────── */}
      {!loading && signatureSongs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <h2 className="text-sm font-mono font-bold text-primary uppercase tracking-widest">
              Signature Tracks
            </h2>
            <div className="flex-1 h-px bg-primary/15 ml-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {signatureSongs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onChallenge={handleChallenge}
                onChallengeVote={handleChallengeVote}
                onPlay={handlePlay}
                nowPlayingId={nowPlaying?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Regular tracks ───────────────────────────────── */}
      {!loading && regularSongs.length > 0 && (
        <div className={nowPlaying ? 'pb-24' : ''}>
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-widest">
              {signatureSongs.length > 0 ? 'More Tracks' : 'All Tracks'} — {regularSongs.length}
            </h2>
            <div className="flex-1 h-px bg-border ml-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {regularSongs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onChallenge={handleChallenge}
                onChallengeVote={handleChallengeVote}
                onPlay={handlePlay}
                nowPlayingId={nowPlaying?.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Now Playing overlay ───────────────────────────── */}
      {nowPlaying && (
        <NowPlaying
          song={nowPlaying}
          onClose={() => setNowPlaying(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={playableSongs.findIndex(s => s.id === nowPlaying.id) < playableSongs.length - 1}
          hasPrev={playableSongs.findIndex(s => s.id === nowPlaying.id) > 0}
          onEnded={handleNext}
        />
      )}

      {/* ── Add song modal ────────────────────────────────── */}
      {showAdd && (
        <AddSongModal
          onClose={() => setShowAdd(false)}
          onAdded={load}
        />
      )}
    </>
  )
}
