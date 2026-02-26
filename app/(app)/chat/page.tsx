'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, MessageCircle, Trash2 } from 'lucide-react'

interface ChatMessage {
  id: string
  content: string
  user_id: string
  created_at: string
  user: {
    id: string
    full_name: string
    nickname: string | null
    role: string
  } | null
}

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

const COLORS = [
  'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500',
  'bg-rose-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-lime-500', 'bg-cyan-500', 'bg-fuchsia-500',
]

function getUserColor(userId: string) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; full_name: string; nickname: string | null; role: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Load initial messages + current user
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, role')
        .eq('id', user.id)
        .single()
      if (profile) setCurrentUser(profile)

      const { data } = await supabase
        .from('chat_messages')
        .select('*, user:profiles!user_id(id, full_name, nickname, role)')
        .order('created_at', { ascending: true })
        .limit(100)
      if (data) {
        setMessages(data as ChatMessage[])
        setTimeout(() => scrollToBottom(false), 50)
      }
      setLoading(false)
    }
    init()
  }, [])

  // Subscribe to realtime new messages
  useEffect(() => {
    const channel = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          // Fetch full message with user profile
          const { data } = await supabase
            .from('chat_messages')
            .select('*, user:profiles!user_id(id, full_name, nickname, role)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              // Avoid duplicates
              if (prev.find(m => m.id === data.id)) return prev
              return [...prev, data as ChatMessage]
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending || !currentUser) return

    setSending(true)
    setInput('')

    const { error } = await supabase
      .from('chat_messages')
      .insert({ content: text, user_id: currentUser.id })

    if (error) {
      setInput(text) // restore on error
      console.error('Chat send error:', error)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('chat_messages').delete().eq('id', id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages: show avatar/name only when sender changes
  const renderMessages = () => {
    return messages.map((msg, i) => {
      const isMe = msg.user_id === currentUser?.id
      const prevMsg = messages[i - 1]
      const isSameUser = prevMsg && prevMsg.user_id === msg.user_id
      const displayName = msg.user?.nickname || msg.user?.full_name || 'Banglan'
      const color = getUserColor(msg.user_id)
      const canDelete = isMe || currentUser?.role === 'admin'

      return (
        <div
          key={msg.id}
          className={`flex items-end gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isSameUser ? 'mt-1' : 'mt-4'}`}
        >
          {/* Avatar — only show when sender changes */}
          <div className="w-7 h-7 shrink-0 mb-0.5">
            {!isSameUser && !isMe && (
              <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-[10px] font-bold`}>
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <div className={`flex flex-col max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
            {/* Name + time — only on first in group */}
            {!isSameUser && (
              <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-xs font-semibold text-foreground/80">{isMe ? 'You' : displayName}</span>
                <span className="text-[10px] font-mono text-muted-foreground/50">{formatTime(msg.created_at)}</span>
              </div>
            )}

            <div className={`flex items-end gap-1.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Bubble */}
              <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                isMe
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground border border-border/50 rounded-bl-sm'
              }`}>
                {msg.content}
              </div>

              {/* Delete button — shows on hover */}
              {canDelete && (
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-muted-foreground/40 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Time on subsequent messages in same group */}
            {isSameUser && (
              <span className="text-[9px] font-mono text-muted-foreground/30 mt-0.5 px-1">
                {formatTime(msg.created_at)}
              </span>
            )}
          </div>
        </div>
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
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-0 scrollbar-hide">
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
