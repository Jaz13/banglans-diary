'use client'

import { useState } from 'react'
import { Pin, Trash2, Loader2, ChevronDown, ChevronUp, MessageCircle, Send } from 'lucide-react'
import type { BoardPost, BoardComment } from '@/types'

interface PostCardProps {
  post: BoardPost
  isAdmin: boolean
  currentUserId: string
  onPin: (id: string, pinned: boolean) => void
  onDelete: (id: string) => void
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  general:      { label: 'GENERAL',      color: 'text-muted-foreground bg-secondary border-border' },
  meetup:       { label: 'MEETUP',       color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  announcement: { label: 'ANNOUNCE',     color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
  reminder:     { label: 'REMINDER',     color: 'text-red-400 bg-red-400/10 border-red-400/30' },
  joke:         { label: 'JOKE',         color: 'text-green-400 bg-green-400/10 border-green-400/30' },
}

export function PostCard({ post, isAdmin, currentUserId, onPin, onDelete }: PostCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<BoardComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cat = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.general

  const toggleExpand = async () => {
    if (!expanded && comments.length === 0) {
      setLoadingComments(true)
      try {
        const res = await fetch(`/api/board/${post.id}`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments ?? [])
        }
      } catch { /* silent */ }
      setLoadingComments(false)
    }
    setExpanded(v => !v)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/board/${post.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (res.ok) {
        const comment = await res.json()
        setComments(prev => [...prev, comment])
        setNewComment('')
      }
    } catch { /* silent */ }
    setSubmittingComment(false)
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await fetch(`/api/board/${post.id}`, { method: 'DELETE' })
      onDelete(post.id)
    } catch { /* silent */ }
    setDeleting(false)
  }

  const handlePin = async () => {
    try {
      await fetch(`/api/board/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !post.is_pinned }),
      })
      onPin(post.id, !post.is_pinned)
    } catch { /* silent */ }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  return (
    <div className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
      post.is_pinned ? 'border-primary/40 shadow-[0_0_10px_oklch(0.75_0.17_68/0.12)]' : 'border-border hover:border-border/80'
    }`}>
      <div className="p-5">
        {/* Top row: category + pin badge + author */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center text-[10px] font-mono font-bold uppercase tracking-widest border rounded-full px-2.5 py-1 ${cat.color}`}>
              {cat.label}
            </span>
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-primary uppercase tracking-widest">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-muted-foreground/60 shrink-0">
            {formatDate(post.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground mb-2 leading-snug" style={{ fontFamily: 'var(--font-rock)', letterSpacing: '0.03em' }}>
          {post.title}
        </h3>

        {/* Content */}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/60">
              {post.author?.full_name ?? 'A Banglan'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Admin controls */}
            {isAdmin && (
              <>
                <button
                  onClick={handlePin}
                  className={`p-1.5 rounded-lg transition-colors ${
                    post.is_pinned ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                  }`}
                  title={post.is_pinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDelete}
                  className={`p-1.5 rounded-lg transition-colors ${
                    confirmDelete ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  }`}
                  title={confirmDelete ? 'Click again to confirm delete' : 'Delete post'}
                >
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
            {/* Own post delete */}
            {!isAdmin && post.author_id === currentUserId && (
              <button
                onClick={handleDelete}
                className={`p-1.5 rounded-lg transition-colors ${
                  confirmDelete ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                }`}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete post'}
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Comments toggle */}
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-border bg-secondary text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
            >
              <MessageCircle className="w-3 h-3" />
              {post.comment_count ?? 0}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {expanded && (
        <div className="border-t border-border/40 px-5 pb-5 pt-4 animate-in slide-in-from-top-1 duration-200">
          {loadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-3">
                  No comments yet. Be the first 🤘
                </p>
              )}
              <div className="space-y-3 mb-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">
                        {(comment.user?.full_name ?? 'B')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-xs font-medium text-foreground">
                          {comment.user?.full_name ?? 'A Banglan'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {new Date(comment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
                >
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}
