'use client'

import { useState } from 'react'
import { X, BarChart3, Plus, Trash2, Loader2 } from 'lucide-react'

interface CreatePollModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreatePollModal({ onClose, onCreated }: CreatePollModalProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addOption = () => {
    if (options.length < 6) setOptions(prev => [...prev, ''])
  }

  const removeOption = (i: number) => {
    if (options.length <= 2) return
    setOptions(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateOption = (i: number, val: string) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = options.map(o => o.trim()).filter(Boolean)
    if (!question.trim() || validOptions.length < 2) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: validOptions }),
      })
      if (res.ok) {
        onCreated()
        onClose()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to create poll.')
      }
    } catch {
      setError('Network error. Try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-250">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground tracking-wider uppercase" style={{ fontFamily: 'var(--font-rock)' }}>
              New Poll
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Question */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Question *</label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Kerala trip — June or July?"
              required
              maxLength={200}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Options *</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <input
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={i === 0 ? 'June' : i === 1 ? 'July' : `Option ${i + 1}`}
                    maxLength={100}
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add option
              </button>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !question.trim() || options.filter(o => o.trim()).length < 2}
              className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-colors"
              style={{ fontFamily: 'var(--font-rock)' }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                </span>
              ) : 'Launch Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
