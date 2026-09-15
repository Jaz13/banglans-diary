'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, LogOut, Loader2 } from 'lucide-react'

export function ProfileMissing({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rock-card rounded-2xl overflow-hidden">
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-primary" />
            </div>
            <h2
              className="text-2xl font-bold text-primary mb-2 tracking-wider"
              style={{ fontFamily: 'var(--font-rock)' }}
            >
              PROFILE NOT READY
            </h2>
            <p className="text-muted-foreground text-sm mb-2">
              We couldn&apos;t find a profile for
            </p>
            <p className="text-foreground font-semibold text-sm mb-6 font-mono break-all">{userEmail}</p>
            <p className="text-muted-foreground text-xs leading-relaxed mb-8">
              Your account exists but your profile setup didn&apos;t finish. An admin can help finish
              setting up your account. If this keeps happening, sign out and sign back in.
            </p>
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all amber-glow flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing out…
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" /> Sign out
                </>
              )}
            </button>
            <p className="text-muted-foreground/60 text-[10px] mt-4 font-mono break-all">ID: {userId}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
