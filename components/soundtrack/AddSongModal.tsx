'use client'

import { useState } from 'react'
import { X, Music, Loader2 } from 'lucide-react'

interface AddSongModalProps {
  onClose: () => void
  onAdded: () => void
}

export function AddSongModal({ onClose, onAdded }: AddSongModalProps) {
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [album, setAlbum] = useState('')
  const [year, setYear] = useState('')
  const [youtubeId, setYoutubeId] = useState('')
  const [note, setNote] = useState('')
  const [isSignature, setIsSignature] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Extract YouTube ID from URL or use raw ID
  const extractYouTubeId = (input: string): string => {
    const urlMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return urlMatch ? urlMatch[1] : input.trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !artist.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/soundtrack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          album: album.trim() || null,
          year: year ? parseInt(year) : null,
          youtube_id: youtubeId ? extractYouTubeId(youtubeId) : null,
          note: note.trim() || null,
          is_signature: isSignature,
        }),
      })

      if (res.ok) {
        onAdded()
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to add track. Try again.')
      }
    } catch {
      setError('Network error. Check your connection.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 ease-out">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-wider uppercase" style={{ fontFamily: 'var(--font-rock)' }}>
              Add to Mixtape
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">Song Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sultans of Swing"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Artist *</label>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Dire Straits"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Year</label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1978"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                YouTube URL or ID <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                value={youtubeId}
                onChange={(e) => setYoutubeId(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or video ID"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Memory Note <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="This played on every Crown Theatre trip..."
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>

          {/* Signature toggle */}
          <button
            type="button"
            onClick={() => setIsSignature(v => !v)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
              isSignature
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-secondary border-border text-muted-foreground hover:border-primary/30'
            }`}
          >
            <span className="text-lg">{isSignature ? '⭐' : '☆'}</span>
            <div className="text-left">
              <p className="text-sm font-medium">Mark as Signature Track</p>
              <p className="text-xs opacity-70">Pinned at top — the definitive Banglan anthems</p>
            </div>
            <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isSignature ? 'border-primary bg-primary' : 'border-muted-foreground'
            }`}>
              {isSignature && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !artist.trim()}
              className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
              style={{ fontFamily: 'var(--font-rock)' }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </span>
              ) : (
                'Add to Mixtape'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
