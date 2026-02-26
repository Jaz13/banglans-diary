'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Guitar, Loader2, Mail, CheckCircle2, KeyRound } from 'lucide-react'
import Link from 'next/link'

function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [isGenericLink, setIsGenericLink] = useState(false)
  const [isFirstUser, setIsFirstUser] = useState(false)
  const [checkingFirst, setCheckingFirst] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Email is editable when: first user, OR generic invite link (no real email)
  const emailEditable = isFirstUser || isGenericLink

  useEffect(() => {
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')
    const genericParam = searchParams.get('generic')
    const roleParam = searchParams.get('role')

    if (token) setInviteToken(token)
    if (roleParam) setInviteRole(roleParam)

    if (genericParam === '1') {
      // Generic invite link — let user enter their own email
      setIsGenericLink(true)
    } else if (emailParam) {
      // Specific invite — check if it's a real or placeholder email
      const isPlaceholder = emailParam.includes('@banglans-diary.app') || emailParam.startsWith('invite-')
      if (isPlaceholder) {
        setIsGenericLink(true)
      } else {
        setInviteEmail(emailParam)
        setEmail(emailParam)
      }
    }

    // Check if there are any existing users (first user = admin, no invite needed)
    fetch('/api/members')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) setIsFirstUser(true)
      })
      .catch(() => setIsFirstUser(true))
      .finally(() => setCheckingFirst(false))
  }, [searchParams])

  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`
    }
    return '/auth/callback'
  }

  // Get the final email to use
  const getSignupEmail = () => emailEditable ? email.trim() : inviteEmail.trim()

  // ── Password signup ───────────────────────────────────────────────
  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirstUser && !inviteToken) {
      setError('You need a valid invite link to join.')
      return
    }
    if (!fullName.trim()) { setError('Please enter your name.'); return }
    const signupEmail = getSignupEmail()
    if (!signupEmail) { setError('Please enter your email.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()

    // signUp creates user + auto-signs them in
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: signupEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) {
      setError('Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Accept invite if we have a token
    if (inviteToken) {
      try {
        await fetch('/api/invite/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: inviteToken, userId }),
        })
      } catch { /* silent */ }
    }

    // Create profile (first user = admin, invited = use invite role)
    const role = isFirstUser ? 'admin' : (inviteRole || 'member')
    try {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      // Use the authenticated client to upsert profile
      await supabase.from('profiles').upsert({
        id: userId,
        email: signupEmail,
        full_name: fullName.trim(),
        role,
      }, { onConflict: 'id' })
    } catch { /* silent — PostAuthSetup will handle if this fails */ }

    // Store as backup for PostAuthSetup
    localStorage.setItem('banglan_full_name', fullName.trim())
    if (inviteToken) localStorage.setItem('banglan_invite_token', inviteToken)
    if (isFirstUser) localStorage.setItem('banglan_is_first_user', 'true')

    // Redirect to dashboard
    router.push('/dashboard')
  }

  // ── Magic link signup ─────────────────────────────────────────────
  const handleMagicLinkSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFirstUser && !inviteToken) {
      setError('You need a valid invite link to join.')
      return
    }
    if (!fullName.trim()) { setError('Please enter your name.'); return }
    const signupEmail = getSignupEmail()
    if (!signupEmail) { setError('Please enter your email.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: signupEmail,
      options: {
        emailRedirectTo: getRedirectUrl(),
        data: { full_name: fullName.trim() },
      },
    })

    if (otpError) {
      setError(otpError.message)
      setLoading(false)
      return
    }

    // Store signup data for after auth callback
    if (inviteToken) localStorage.setItem('banglan_invite_token', inviteToken)
    localStorage.setItem('banglan_full_name', fullName.trim())
    if (isFirstUser) localStorage.setItem('banglan_is_first_user', 'true')

    setMagicLinkSent(true)
    setLoading(false)
  }

  if (checkingFirst) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  // Magic link sent — show confirmation
  if (magicLinkSent) {
    const displayEmail = emailEditable ? email : inviteEmail
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
            <p className="text-foreground font-semibold text-sm mb-6 font-mono">{displayEmail}</p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-8">
              Click the link in the email to join the Banglans.<br />
              No password needed. Check spam if you don&apos;t see it.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setMagicLinkSent(false); setLoading(false) }}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                Try again
              </button>
              <button
                onClick={() => { setMagicLinkSent(false); setUsePassword(true) }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <KeyRound className="w-3 h-3" />
                  Didn&apos;t get the email? Sign up with password instead
                </span>
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
        <div className="px-8 pt-10 pb-6 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Guitar className="w-7 h-7 text-primary" />
            <span className="font-rock text-3xl neon-flicker">BANGLAN&apos;S DIARY</span>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            {isFirstUser
              ? 'Welcome, founding Banglan 🤘 You\'ll be made admin.'
              : 'Join the legend 🔥'}
          </p>
        </div>
        <div className="px-8 py-8">
          <form onSubmit={usePassword ? handlePasswordSignup : handleMagicLinkSignup} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Your Email</label>
              {emailEditable ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              ) : (
                <input
                  type="email"
                  value={inviteEmail}
                  disabled
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground opacity-70 cursor-not-allowed"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Dr. Your Name"
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

            {/* Password field — shown when usePassword is true */}
            {usePassword && (
              <div className="animate-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{usePassword ? 'Creating account…' : 'Sending magic link…'}</>
              ) : usePassword ? (
                <><KeyRound className="w-4 h-4" />{isFirstUser ? 'Create Admin Account 🤘' : 'Join the Banglans 🔥'}</>
              ) : (
                <><Mail className="w-4 h-4" />{isFirstUser ? 'Create Admin Account 🤘' : 'Join the Banglans 🔥'}</>
              )}
            </button>

            {/* Toggle between magic link and password */}
            <button
              type="button"
              onClick={() => { setUsePassword(!usePassword); setError('') }}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1"
            >
              <span className="flex items-center justify-center gap-1.5">
                {usePassword ? (
                  <><Mail className="w-3 h-3" />Use magic link instead (no password)</>
                ) : (
                  <><KeyRound className="w-3 h-3" />Sign up with password instead</>
                )}
              </span>
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {usePassword
                ? 'Create a password to sign in directly — no email verification needed'
                : 'No password needed — we\'ll email you a magic link'}
            </p>
          </form>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">
        Already a Banglan? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <SignupForm />
    </Suspense>
  )
}
