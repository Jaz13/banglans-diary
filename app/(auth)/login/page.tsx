'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Guitar, Loader2, Mail, KeyRound, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const ROCK_QUOTES = [
  '"Some people feel the rain. Others just get wet." — Bob Dylan',
  '"Rock and roll is here to stay." — Neil Young',
  '"Music gives a soul to the universe." — Plato',
  '"Without music, life would be a mistake." — Nietzsche',
]

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [showPasswordLogin, setShowPasswordLogin] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const quote = ROCK_QUOTES[Math.floor(Math.random() * ROCK_QUOTES.length)]

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setError('Login link expired or invalid. Try again.')
    }
  }, [searchParams])

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }
    return '/auth/callback'
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setMagicLinkSent(true)
    setLoading(false)
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  // Magic link sent — show confirmation
  if (magicLinkSent) {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="rock-card rounded-2xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2
              className="text-2xl font-bold text-primary mb-2 tracking-wider"
              style={{ fontFamily: 'var(--font-rock)' }}
            >
              CHECK YOUR EMAIL
            </h2>
            <p className="text-muted-foreground text-sm mb-2">
              We sent a magic link to
            </p>
            <p className="text-foreground font-semibold text-sm mb-6 font-mono">{email}</p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-8">
              Click the link in the email to sign in instantly.<br />
              No password needed. Check spam if you don&apos;t see it.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setMagicLinkSent(false); setLoading(false) }}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                Use a different email
              </button>
              <button
                onClick={() => { setShowPasswordLogin(true); setMagicLinkSent(false) }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Or sign in with password instead
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
          <p className="text-xs text-muted-foreground italic">Class of 92 · Calicut Medical College</p>
          <div className="mt-4 px-4 py-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground italic leading-relaxed">{quote}</p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">Welcome back, legend</h2>

          {!showPasswordLogin ? (
            /* Magic Link Login (primary) */
            <form onSubmit={handleMagicLink} className="space-y-4">
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
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all amber-glow flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Sending link…</>
                ) : (
                  <><Mail className="w-4 h-4" />Send Magic Link 🎸</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordLogin(true)}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  Sign in with password instead
                </span>
              </button>
            </form>
          ) : (
            /* Password Login (fallback) */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
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
              <button
                type="button"
                onClick={() => { setShowPasswordLogin(false); setError('') }}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  Use magic link instead (no password)
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Got an invite? <Link href="/signup" className="text-primary hover:underline">Create your account</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
