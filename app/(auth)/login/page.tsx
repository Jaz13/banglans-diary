'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Guitar, Loader2 } from 'lucide-react'
import Link from 'next/link'

const ROCK_QUOTES = [
  '"Some people feel the rain. Others just get wet." — Bob Dylan',
  '"Rock and roll is here to stay." — Neil Young',
  '"Music gives a soul to the universe." — Plato',
  '"Without music, life would be a mistake." — Nietzsche',
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const quote = ROCK_QUOTES[Math.floor(Math.random() * ROCK_QUOTES.length)]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="rock-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Guitar className="w-7 h-7 text-primary" />
            <span className="font-rock text-3xl neon-flicker">BANGLANS DIARY</span>
          </div>
          <p className="text-xs text-muted-foreground italic">Class of 99 · Calicut Medical College</p>
          <div className="mt-4 px-4 py-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground italic leading-relaxed">{quote}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Welcome back, legend</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
              />
            </div>
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all amber-glow"
            >
              {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Signing in…</span> : 'Sign In 🎸'}
            </button>
          </form>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Got an invite? <Link href="/signup" className="text-primary hover:underline">Create your account</Link>
      </p>
    </div>
  )
}
