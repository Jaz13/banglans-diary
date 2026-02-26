'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Guitar, Loader2, Music, Camera, Map, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function InviteLandingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviterName, setInviterName] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/invite/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInviteEmail(data.email)
          setInviterName(data.inviter_name || 'A Banglan')
          setStatus('valid')
        } else {
          setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  if (status === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Checking your invite…</p>
    </div>
  )

  if (status === 'invalid') return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="rock-card rounded-2xl p-8 text-center">
        <p className="text-4xl mb-4">💔</p>
        <h2 className="text-xl font-semibold text-foreground mb-2">Invite not found</h2>
        <p className="text-muted-foreground text-sm mb-6">This link may have expired or already been used. Ask your Banglan to send a new one.</p>
        <Link href="/login" className="text-primary text-sm hover:underline">Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="rock-card rounded-2xl overflow-hidden">
        <div className="px-8 pt-10 pb-6 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Guitar className="w-7 h-7 text-primary" />
            <span className="font-rock text-3xl neon-flicker">BANGLANS DIARY</span>
          </div>
          <p className="text-xs text-muted-foreground">Class of 99 · Calicut Medical College</p>
        </div>
        <div className="px-8 py-8">
          <div className="text-center mb-6">
            <p className="text-2xl mb-2">🎸</p>
            <h2 className="text-lg font-semibold text-foreground">{inviterName} invited you!</h2>
            <p className="text-sm text-muted-foreground mt-1">You're joining the legendary Banglans crew</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: Camera, label: 'Photos & Albums', color: 'text-primary' },
              { icon: Map, label: 'Trip Planning', color: 'text-accent' },
              { icon: Trophy, label: 'Wall of Fame', color: 'text-primary' },
              { icon: Music, label: 'Banglan Mixtape', color: 'text-accent' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <span className="text-xs text-foreground">{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push(`/signup?token=${token}&email=${encodeURIComponent(inviteEmail)}`)}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all amber-glow"
          >
            Join the Banglans 🔥
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
