'use client'

import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    emojis: ['😀', '😂', '🥹', '😍', '🥰', '😘', '😊', '😇', '🤩', '😜', '😎', '🤗', '🫶', '🥺', '😢', '😭', '😤', '😱', '🤯', '🫣'],
  },
  {
    label: 'Banglan',
    emojis: ['🍺', '🎸', '🏏', '🏆', '👨‍⚕️', '💊', '🩺', '🏥', '🎵', '🎶', '🤘', '🔥', '🍻', '🥂', '🌴', '🛫'],
  },
  {
    label: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖', '💗', '💓', '💝', '🫀', '💘', '💞'],
  },
  {
    label: 'Nature',
    emojis: ['🌿', '🌸', '🌻', '🌺', '🍃', '🌈', '☀️', '🌙', '⭐', '🦋', '🐣', '🌊', '🔥', '❄️', '🍂', '🌳'],
  },
  {
    label: 'Vibes',
    emojis: ['🎂', '🎉', '🎊', '🎈', '🎁', '🎄', '🎃', '🎏', '🏖️', '⛺', '🎡', '🎢', '🎠', '📸', '🎨', '🎵'],
  },
  {
    label: 'Food',
    emojis: ['🍕', '🍦', '🧁', '🍰', '🎂', '🍫', '🍬', '🍭', '🍩', '🥤', '🍼', '☕', '🥛', '🍎', '🍌', '🍓'],
  },
  {
    label: 'Hands',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '💪', '🙌', '👐', '🤲', '🙏', '✋', '🫡', '🫰'],
  },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  className?: string
}

export function EmojiPicker({ onSelect, className = '' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        title="Add emoji"
      >
        <Smile className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-72 bg-card border border-border rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
          <div className="flex gap-0.5 px-2 pt-2 pb-1 border-b border-border overflow-x-auto scrollbar-none">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategory(i)}
                className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === i
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="p-2 grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onSelect(emoji)
                  setOpen(false)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
