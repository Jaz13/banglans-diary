'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { PostCard } from '@/components/board/PostCard'
import { NewPostModal } from '@/components/board/NewPostModal'
import { useAuth } from '@/components/providers/AuthProvider'
import type { BoardPost } from '@/types'

const CATEGORY_FILTERS = [
  { value: 'all',          label: 'ALL' },
  { value: 'meetup',       label: '🍻 MEETUP' },
  { value: 'announcement', label: '📢 ANNOUNCE' },
  { value: 'joke',         label: '😂 JOKE' },
  { value: 'reminder',     label: '⏰ REMINDER' },
  { value: 'general',      label: '💬 GENERAL' },
]

export default function BoardPage() {
  const { user, isAdmin } = useAuth()
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/board')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setPosts(data)
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handlePin = (id: string, pinned: boolean) => {
    setPosts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, is_pinned: pinned } : p)
      return [...updated].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1
        if (!a.is_pinned && b.is_pinned) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    })
  }

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.category === filter)

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            THE BOARD
          </h1>
          <div className="rock-divider mb-3" />
          <p className="text-muted-foreground">
            Bulletins, meetups, jokes & more 📋
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="shrink-0 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-rock)' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:block">New Post</span>
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {CATEGORY_FILTERS.map(cat => (
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
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-secondary animate-pulse h-36"
              style={{ animationDelay: `${i * 100}ms`, animationDuration: '1.2s' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 animate-in fade-in duration-300">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 tracking-wide" style={{ fontFamily: 'var(--font-rock)' }}>
            {filter === 'all' ? 'THE BOARD IS QUIET' : `NO ${filter.toUpperCase()} POSTS YET`}
          </h2>
          <p className="text-muted-foreground mb-6">
            {filter === 'all'
              ? "Break the silence. Post something."
              : "Try another filter or post something."}
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            <MessageSquare className="w-4 h-4" />
            Post Something
          </button>
        </div>
      )}

      {/* Posts list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((post, i) => (
            <div
              key={post.id}
              className="animate-in fade-in slide-in-from-bottom-3 duration-400"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: 'both' }}
            >
              <PostCard
                post={post}
                isAdmin={isAdmin}
                currentUserId={user?.id || ''}
                onPin={handlePin}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* New post modal */}
      {showNew && (
        <NewPostModal
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}
    </>
  )
}
