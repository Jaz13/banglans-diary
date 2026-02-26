'use client'

import { useEffect, useRef, useState, useCallback, useMemo, type PointerEvent as RPointerEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageCircle, Trash2, ChevronUp } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatReaction {
  emoji: string
  user_ids: string[]
}

interface ChatMessage {
  id: string
  content: string
  user_id: string
  created_at: string
  reactions: ChatReaction[]
  user: {
    id: string
    full_name: string
    nickname: string | null
    role: string
  } | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 100
const SILENCE_THRESHOLD_MS = 48 * 60 * 60 * 1000 // 48 hours
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏']

const SILENCE_NUDGES = [
  { text: "It's been quiet... too quiet.", sub: 'Someone break the silence 🤘' },
  { text: '48 hours of radio silence?', sub: 'The Banglan chat demands noise' },
  { text: 'Silence is not golden.', sub: 'Drop a message, a meme, anything' },
  { text: 'The chat misses you.', sub: 'Say something legendary' },
  { text: 'Did everyone get busy saving lives?', sub: 'Take a break, say hello 👋' },
]

const COLORS = [
  'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500',
  'bg-rose-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-lime-500', 'bg-cyan-500', 'bg-fuchsia-500',
]

// ─── Utils ───────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (isToday) return time
  if (isYesterday) return `Yesterday ${time}`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + time
}

function getUserColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/** Long-press detection for mobile */
function useLongPress(onLongPress: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didFire = useRef(false)

  const start = useCallback(() => {
    didFire.current = false
    timerRef.current = setTimeout(() => {
      didFire.current = true
      onLongPress()
    }, ms)
  }, [onLongPress, ms])

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => cancel, [cancel])

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e: RPointerEvent | React.MouseEvent) => {
      if (didFire.current) e.preventDefault()
    },
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SilenceNudge() {
  const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000))
  const nudge = SILENCE_NUDGES[dayIndex % SILENCE_NUDGES.length]

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-2xl bg-primary/5 border border-primary/10 animate-in fade-in duration-500">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <MessageCircle className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground tracking-wide" style={{ fontFamily: 'var(--font-rock)' }}>
          {nudge.text}
        </p>
        <p className="text-xs text-muted-foreground">{nudge.sub}</p>
      </div>
    </div>
  )
}

/** Reaction pills shown below a message bubble */
function ReactionBar({ reactions, messageId, currentUserId, onToggle }: {
  reactions: ChatReaction[]
  messageId: string
  currentUserId: string
  onToggle: (messageId: string, emoji: string) => void
}) {
  if (reactions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(r => {
        const isMine = r.user_ids.includes(currentUserId)
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(messageId, r.emoji)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
              isMine
                ? 'bg-primary/15 border border-primary/30 text-foreground'
                : 'bg-secondary border border-border/50 text-muted-foreground hover:border-primary/20'
            }`}
          >
            <span>{r.emoji}</span>
            <span className="font-mono text-[10px]">{r.user_ids.length}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Individual message bubble with actions */
function MessageBubble({ msg, isMe, isSameUser, canDelete, currentUserId, onDelete, onReact }: {
  msg: ChatMessage; isMe: boolean; isSameUser: boolean; canDelete: boolean
  currentUserId: string
  onDelete: (id: string) => void
  onReact: (messageId: string, emoji: string) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const displayName = msg.user?.nickname || msg.user?.full_name || 'Banglan'
  const color = getUserColor(msg.user_id)

  const longPress = useLongPress(
    useCallback(() => {
      setShowActions(true)
    }, []),
    400
  )

  // Auto-hide actions after 5s
  useEffect(() => {
    if (!showActions) return
    const t = setTimeout(() => setShowActions(false), 5000)
    return () => clearTimeout(t)
  }, [showActions])

  return (
    <div
      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isSameUser ? 'mt-1' : 'mt-4'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-7 h-7 shrink-0 mb-0.5">
        {!isSameUser && !isMe && (
          <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold`}>
            {getInitials(displayName)}
          </div>
        )}
      </div>

      <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Name + time — first in group */}
        {!isSameUser && (
          <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs font-semibold text-foreground/80">{isMe ? 'You' : displayName}</span>
            <span className="text-[10px] font-mono text-muted-foreground/50">{formatTime(msg.created_at)}</span>
          </div>
        )}

        <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Bubble */}
          <div
            {...longPress}
            className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words select-none touch-manipulation cursor-default ${
              isMe
                ? 'bg-primary text-primary-foreground rounded-br-sm'
                : 'bg-secondary text-foreground border border-border/50 rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>

          {/* Action buttons — hover (desktop) + long-press (mobile) */}
          <div className={`flex items-center gap-0.5 shrink-0 transition-all duration-150 ${
            showActions ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            {/* Quick emoji reactions */}
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => { onReact(msg.id, emoji); setShowActions(false) }}
                className="p-1 rounded-md hover:bg-secondary text-sm hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => onDelete(msg.id)}
                className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Reaction pills */}
        <ReactionBar
          reactions={msg.reactions}
          messageId={msg.id}
          currentUserId={currentUserId}
          onToggle={onReact}
        />

        {/* Time on subsequent messages in same group */}
        {isSameUser && (
          <span className="text-[9px] font-mono text-muted-foreground/30 mt-0.5 px-1">
            {formatTime(msg.created_at)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user: authUser, isAdmin } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const currentUser = authUser ? { id: authUser.id, full_name: authUser.full_name, nickname: authUser.nickname ?? null, role: authUser.role } : null
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Silence check: is the latest message older than 48 hours?
  const isSilent = useMemo(() => {
    if (loading || messages.length === 0) return false
    const lastMsg = messages[messages.length - 1]
    return Date.now() - new Date(lastMsg.created_at).getTime() > SILENCE_THRESHOLD_MS
  }, [loading, messages])

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // ── Load initial messages (latest PAGE_SIZE, reversed to chronological) ────
  useEffect(() => {
    const init = async () => {
      const { data, count } = await supabase
        .from('chat_messages')
        .select('*, user:profiles!user_id(id, full_name, nickname, role)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (data) {
        const reversed = (data as ChatMessage[]).reverse()
        // Fetch reactions for these messages
        const msgIds = reversed.map(m => m.id)
        const { data: reactionsData } = await supabase
          .from('chat_reactions')
          .select('message_id, emoji, user_id')
          .in('message_id', msgIds)

        // Group reactions by message
        const reactionsMap = new Map<string, Map<string, string[]>>()
        if (reactionsData) {
          for (const r of reactionsData) {
            if (!reactionsMap.has(r.message_id)) reactionsMap.set(r.message_id, new Map())
            const emojiMap = reactionsMap.get(r.message_id)!
            if (!emojiMap.has(r.emoji)) emojiMap.set(r.emoji, [])
            emojiMap.get(r.emoji)!.push(r.user_id)
          }
        }

        // Attach reactions to messages
        const withReactions = reversed.map(m => ({
          ...m,
          reactions: reactionsMap.has(m.id)
            ? Array.from(reactionsMap.get(m.id)!.entries()).map(([emoji, user_ids]) => ({ emoji, user_ids }))
            : [],
        }))

        setMessages(withReactions)
        setHasOlder((count ?? 0) > PAGE_SIZE)
        setTimeout(() => scrollToBottom(false), 50)
      }
      setLoading(false)
    }
    init()
  }, [])

  // ── Load older messages ────────────────────────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!messages.length || loadingOlder) return
    setLoadingOlder(true)

    const container = scrollContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    const oldestTimestamp = messages[0].created_at
    const { data } = await supabase
      .from('chat_messages')
      .select('*, user:profiles!user_id(id, full_name, nickname, role)')
      .order('created_at', { ascending: false })
      .lt('created_at', oldestTimestamp)
      .limit(PAGE_SIZE)

    if (data) {
      const older = (data as ChatMessage[]).reverse()

      // Fetch reactions for older messages
      const msgIds = older.map(m => m.id)
      const { data: reactionsData } = await supabase
        .from('chat_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', msgIds)

      const reactionsMap = new Map<string, Map<string, string[]>>()
      if (reactionsData) {
        for (const r of reactionsData) {
          if (!reactionsMap.has(r.message_id)) reactionsMap.set(r.message_id, new Map())
          const emojiMap = reactionsMap.get(r.message_id)!
          if (!emojiMap.has(r.emoji)) emojiMap.set(r.emoji, [])
          emojiMap.get(r.emoji)!.push(r.user_id)
        }
      }

      const withReactions = older.map(m => ({
        ...m,
        reactions: reactionsMap.has(m.id)
          ? Array.from(reactionsMap.get(m.id)!.entries()).map(([emoji, user_ids]) => ({ emoji, user_ids }))
          : [],
      }))

      setMessages(prev => [...withReactions, ...prev])
      setHasOlder(data.length === PAGE_SIZE)

      // Preserve scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
    }
    setLoadingOlder(false)
  }, [messages, loadingOlder, supabase])

  // ── Realtime subscriptions ─────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('chat_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const { data } = await supabase
            .from('chat_messages')
            .select('*, user:profiles!user_id(id, full_name, nickname, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              if (prev.find(m => m.id === data.id)) return prev
              return [...prev, { ...data, reactions: [] } as ChatMessage]
            })
            setTimeout(() => scrollToBottom(true), 50)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reactions' },
        (payload) => {
          const { message_id, emoji, user_id } = payload.new as { message_id: string; emoji: string; user_id: string }
          setMessages(prev => prev.map(m => {
            if (m.id !== message_id) return m
            const existing = m.reactions.find(r => r.emoji === emoji)
            if (existing) {
              if (existing.user_ids.includes(user_id)) return m
              return {
                ...m,
                reactions: m.reactions.map(r =>
                  r.emoji === emoji ? { ...r, user_ids: [...r.user_ids, user_id] } : r
                ),
              }
            }
            return { ...m, reactions: [...m.reactions, { emoji, user_ids: [user_id] }] }
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_reactions' },
        (payload) => {
          const { message_id, emoji, user_id } = payload.old as { message_id: string; emoji: string; user_id: string }
          setMessages(prev => prev.map(m => {
            if (m.id !== message_id) return m
            return {
              ...m,
              reactions: m.reactions
                .map(r => r.emoji === emoji ? { ...r, user_ids: r.user_ids.filter(u => u !== user_id) } : r)
                .filter(r => r.user_ids.length > 0),
            }
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending || !currentUser) return

    setSending(true)
    setInput('')

    const optimisticId = 'opt-' + Date.now()
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      content: text,
      user_id: currentUser.id,
      created_at: new Date().toISOString(),
      reactions: [],
      user: currentUser,
    }
    setMessages(prev => [...prev, optimisticMsg])
    setTimeout(() => scrollToBottom(true), 30)

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ content: text, user_id: currentUser.id })
      .select('id')
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(text)
      console.error('Chat send error:', error)
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id } : m))
    }
    setSending(false)
    inputRef.current?.focus()
  }

  // ── Delete message ─────────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
    fetch('/api/chat', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

  // ── Toggle reaction ────────────────────────────────────────────────────────
  const handleReact = useCallback((messageId: string, emoji: string) => {
    if (!currentUser) return
    const userId = currentUser.id

    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m
      const existing = m.reactions.find(r => r.emoji === emoji)
      if (existing?.user_ids.includes(userId)) {
        // Remove my reaction
        const updated = m.reactions
          .map(r => r.emoji === emoji ? { ...r, user_ids: r.user_ids.filter(u => u !== userId) } : r)
          .filter(r => r.user_ids.length > 0)
        return { ...m, reactions: updated }
      }
      // Add my reaction
      if (existing) {
        return {
          ...m,
          reactions: m.reactions.map(r =>
            r.emoji === emoji ? { ...r, user_ids: [...r.user_ids, userId] } : r
          ),
        }
      }
      return { ...m, reactions: [...m.reactions, { emoji, user_ids: [userId] }] }
    }))

    // Fire-and-forget API call
    fetch('/api/chat/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: messageId, emoji }),
    })
  }, [currentUser])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderMessages = () => {
    return messages.map((msg, i) => {
      const isMe = msg.user_id === currentUser?.id
      const prevMsg = messages[i - 1]
      const isSameUser = prevMsg && prevMsg.user_id === msg.user_id
      const canDelete = isMe || currentUser?.role === 'admin'

      return (
        <MessageBubble
          key={msg.id}
          msg={msg}
          isMe={isMe}
          isSameUser={isSameUser}
          canDelete={canDelete}
          currentUserId={currentUser?.id || ''}
          onDelete={handleDelete}
          onReact={handleReact}
        />
      )
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-primary tracking-wide neon-flicker"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            BANGLAN CHAT
          </h1>
          <div className="rock-divider mt-1" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">Live</span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-1 py-2 space-y-0 scrollbar-hide">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-rock text-xl text-foreground tracking-wide mb-1">SILENCE IS NOT GOLDEN</h3>
            <p className="text-sm text-muted-foreground">Be the first Banglan to say something 🤘</p>
          </div>
        )}

        {/* Load earlier messages button */}
        {!loading && hasOlder && (
          <div className="flex justify-center py-3">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground/60 hover:text-primary transition-colors px-4 py-2 rounded-full border border-border/50 hover:border-primary/30 disabled:opacity-40"
            >
              {loadingOlder
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <ChevronUp className="w-3 h-3" />
              }
              {loadingOlder ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* 48-hour silence nudge */}
        {isSilent && <SilenceNudge />}

        {!loading && renderMessages()}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="mt-4 flex items-center gap-2 bg-secondary border border-border rounded-2xl px-4 py-2 focus-within:border-primary/40 focus-within:shadow-[0_0_0_2px_oklch(0.75_0.17_68/0.1)] transition-all"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Say something legendary... 🤘"
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
          maxLength={500}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-all shrink-0"
        >
          {sending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </form>
    </div>
  )
}
