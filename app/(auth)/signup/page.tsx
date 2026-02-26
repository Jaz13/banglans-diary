'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Guitar, Loader2 } from 'lucide-react'
import Link from 'next/link'

function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviterName, setInviterName] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    if (token) setInviteToken(token)
    if (email) setInviteEmail(email)
  }, [searchParams])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteToken) { setError('You need a valid invite link to join.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: inviteEmail,
      password,
      options: { data: { full_name: fullName } },
    })
    if (signUpError || !data.user) { setError(signUpError?.message || 'Signup failed'); setLoading(false); return }
    await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: inviteToken, userId: data.user.id }),
    })
    router.push('/dashboard')
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="rock-card rounded-2xl overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Guitar className="w-7 h-7 text-primary" />
            <span className="font-rock text-3xl neon-flicker">BANGLANS DIARY</span>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            {inviterName ? `${inviterName} invited you to join the Banglans 🔥` : 'Join the legend'}
          </p>
        </div>
        <div className="px-8 py-8">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Your Email</label>
              <input type="email" value={inviteEmail} disabled className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground opacity-70 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Your Name" required className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
            </div>
            {error && <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3"><p className="text-sm text-destructive">{error}</p></div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating account…</span> : 'Join the Banglans 🔥'}
            </button>
          </form>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">Already a Banglan? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}><SignupForm /></Suspense>
}
