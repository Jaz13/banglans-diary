'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'

/**
 * Runs ONCE after magic link auth to:
 * 1. Create profile if it doesn't exist
 * 2. Accept invite token if stored in localStorage
 *
 * Uses AuthProvider to check if profile exists — avoids redundant DB queries.
 * Only fires when localStorage has pending setup data (invite token / name).
 */
export function PostAuthSetup() {
  const { user } = useAuth()
  const hasRun = useRef(false)

  useEffect(() => {
    // Only run once per mount, and only if there's pending setup data
    if (hasRun.current) return
    const inviteToken = localStorage.getItem('banglan_invite_token')
    const storedName = localStorage.getItem('banglan_full_name')

    // Nothing to do — skip all DB queries
    if (!inviteToken && !storedName) return

    hasRun.current = true

    const setup = async () => {
      const supabase = createClient()

      // Profile doesn't exist yet (user is null from AuthProvider) — create it
      if (!user && storedName) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        await supabase.from('profiles').insert({
          id: authUser.id,
          email: authUser.email,
          full_name: storedName,
          role: 'admin',
        })
        localStorage.removeItem('banglan_full_name')
        localStorage.removeItem('banglan_is_first_user')
      }

      // Handle invite token acceptance
      if (inviteToken) {
        const userId = user?.id
        if (userId) {
          try {
            await fetch('/api/invite/accept', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: inviteToken, userId }),
            })
          } catch { /* silent */ }
        }
        localStorage.removeItem('banglan_invite_token')
      }

      // Update full_name if stored and profile exists but name is missing
      if (storedName && user && !user.full_name) {
        await supabase.from('profiles').update({ full_name: storedName }).eq('id', user.id)
        localStorage.removeItem('banglan_full_name')
      } else {
        localStorage.removeItem('banglan_full_name')
      }
    }

    setup()
  }, [user])

  return null
}
