'use client'

import { useState, useEffect, useCallback } from 'react'
import { Music, Plus, Star } from 'lucide-react'
import { SongCard } from '@/components/soundtrack/SongCard'
import { AddSongModal } from '@/components/soundtrack/AddSongModal'
import { createClient } from '@/lib/supabase/client'
import type { SoundtrackSong } from '@/types'

export default function SoundtrackPage() {
  const [songs, setSongs] = useState<SoundtrackSong[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const load = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setIsAdmin(true)
      }

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
  }

  const handleToggleSignature = (id: string, value: boolean) => {
    setSongs(prev => prev.map(s => s.id === id ? { ...s, is_signature: value } : s))
  }

  const signatureSongs = songs.filter(s => s.is_signature)
  const allSongs = songs

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            THE MIXTAPE
          </h1>
          <div className="rock-divider mb-3" />
          <p className="text-muted-foreground">
            The soundtrack of our lives 🎸
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">Add Track</span>
        </button>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-secondary animate-pulse h-16"
              style={{ animationDelay: `${i * 80}ms`, animationDuration: '1.2s' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && songs.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Music className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-wide" style={{ fontFamily: 'var(--font-rock)' }}>
            THE MIXTAPE IS EMPTY
          </h2>
          <p className="text-muted-foreground mb-6">
            Every legend needs a soundtrack. Add the first track.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <Music className="w-4 h-4" />
            Add First Track
          </button>
        </div>
      )}

      {/* Signature tracks section */}
      {!loading && signatureSongs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <h2 className="text-sm font-mono font-bold text-primary uppercase tracking-widest">
              Signature Tracks
            </h2>
          </div>
          <div className="space-y-2">
            {signatureSongs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onToggleSignature={handleToggleSignature}
              />
            ))}
          </div>
        </div>
      )}

      {/* All tracks section */}
      {!loading && allSongs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-widest">
              All Tracks — {allSongs.length}
            </h2>
          </div>
          <div className="space-y-2">
            {allSongs.map(song => (
              <SongCard
                key={song.id}
                song={song}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onToggleSignature={handleToggleSignature}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add song modal */}
      {showAdd && (
        <AddSongModal
          onClose={() => setShowAdd(false)}
          onAdded={load}
        />
      )}
    </>
  )
}
