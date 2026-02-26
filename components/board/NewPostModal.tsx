'use client'

import { useState } from 'react'
import { X, MessageSquare, Loader2 } from 'lucide-react'

interface NewPostModalProps {
  onClose: () => void
  onCreated: () => void
}

const CATEGORIES = [
  { value: 'general',      label: '💬 General',      desc: 'Anything goes' },
  { value: 'meetup',       label: '🍻 Meetup',        desc: 'Plan a get-together' },
  { value: 'announcement', label: '📢 Announcement',  desc: 'Important news' },
  { value: 'reminder',     label: '⏰ Reminder',      desc: 'Don\'t forget' },
  { value: 'joke',         label: '😂 Joke',          desc: 'Make them laugh' },
]

export function NewPostModal({ onClose, onCreated }: NewPostModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
        }),
      })

      if (res.ok) {
        onCreated()
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to post. Try again.')
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
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-wider uppercase" style={{ fontFamily: 'var(--font-rock)' }}>
              New Post
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <div className="grid grid-cols-5 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`py-2 px-1 rounded-xl text-xs font-medium text-center transition-all border ${
                    category === cat.value
                      ? 'bg-primary/15 text-primary border-primary/40'
                      : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              required
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Message *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share the details..."
              required
              rows={4}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
            />
          </div>

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
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
              style={{ fontFamily: 'var(--font-rock)' }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Posting...
                </span>
              ) : (
                'Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
