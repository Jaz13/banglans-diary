'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AlbumCard } from '@/components/albums/AlbumCard'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import type { Album } from '@/types'

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState('')

  const loadAlbums = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single()
        if (profile) setUserRole(profile.role)
      }
      const res = await fetch('/api/albums')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setAlbums(data)
        setLoading(false)
        return
      }
      const supabase2 = createClient()
      const { data } = await supabase2
        .from('albums')
        .select('*, photos(id, thumbnail_url, cloudinary_url, taken_at, created_at)')
        .order('updated_at', { ascending: false })
      if (data && data.length > 0) {
        setAlbums(data.map((a: any) => {
          const photos = a.photos ?? []
          const sorted = [...photos].sort((x: any, y: any) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())
          return {
            ...a,
            photo_count: photos.length,
            first_photo_url: sorted[0]?.thumbnail_url || sorted[0]?.cloudinary_url || null,
            cover_photos: sorted.slice(0, 5).map((p: any) => (p.thumbnail_url || p.cloudinary_url || '').replace(/[\n\r]/g, '')).filter(Boolean),
          }
        }))
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadAlbums() }, [loadAlbums])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        setError(`Create failed: ${err.error || 'unknown error'}`)
        setCreating(false)
        return
      }
      setNewTitle('')
      setNewDesc('')
      setShowCreate(false)
      loadAlbums()
    } catch (err: any) {
      setError(`Network error: ${err.message}`)
    }
    setCreating(false)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1 font-rock tracking-wide">
            ALBUMS <span className="text-2xl opacity-70">🎞️</span>
          </h1>
          <div className="rock-divider mb-2" />
          <p className="text-muted-foreground">Every era, every trip, every legend</p>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors font-rock tracking-widest"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">NEW ALBUM</span>
          </button>
        )}
      </div>

      {showCreate && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 slide-in-from-bottom-2 duration-250 ease-out">
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground font-rock tracking-wide">CREATE ALBUM</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Album name</label>
                  <EmojiPicker onSelect={(emoji) => setNewTitle((v) => v + emoji)} />
                </div>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Goa Trip 2019, Crown Theatre Nights..."
                  required
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <EmojiPicker onSelect={(emoji) => setNewDesc((v) => v + emoji)} />
                </div>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What's the story behind this album?"
                  rows={2}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              {error && <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setError('') }}
                  className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newTitle.trim()}
                  className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors font-rock tracking-widest">
                  {creating ? 'CREATING...' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-secondary animate-pulse aspect-[4/3]" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      )}

      {!loading && albums.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <FolderOpen className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 font-rock tracking-wide">NO ALBUMS YET</h2>
          <p className="text-muted-foreground mb-6">
            {userRole === 'admin' ? 'Create albums to organise the Banglan archive' : 'No albums have been created yet'}
          </p>
          {userRole === 'admin' && (
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors font-rock tracking-widest">
              <Plus className="w-4 h-4" />
              CREATE FIRST ALBUM
            </button>
          )}
        </div>
      )}

      {!loading && albums.length > 0 && <div className="rock-divider mb-5" />}

      {!loading && albums.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map((album, i) => (
            <div key={album.id} className="animate-in fade-in slide-in-from-bottom-3 duration-400"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: 'both' }}>
              <AlbumCard album={album} index={i} />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
