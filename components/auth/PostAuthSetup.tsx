'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Runs after magic link auth to:
 * 1. Create profile if it doesn't exist
 * 2. Accept invite token if stored in localStorage
 * 3. Set admin role for first user
 */
export function PostAuthSetup() {
  useEffect(() => {
    const setup = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existing) {
        // Profile doesn't exist — create it
        const fullName = localStorage.getItem('banglan_full_name') || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Banglan'
        const isFirstUser = localStorage.getItem('banglan_is_first_user') === 'true'

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: isFirstUser ? 'admin' : 'member',
        })

        // Clean up
        localStorage.removeItem('banglan_is_first_user')
      }

      // Handle invite token acceptance
      const inviteToken = localStorage.getItem('banglan_invite_token')
      if (inviteToken) {
        try {
          await fetch('/api/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken, userId: user.id }),
          })
        } catch { /* silent — invite may already be accepted */ }
        localStorage.removeItem('banglan_invite_token')
      }

      // Update full_name if it was stored and profile already existed
      const storedName = localStorage.getItem('banglan_full_name')
      if (storedName && existing) {
        // Only update if current name is missing
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (profile && !profile.full_name) {
          await supabase.from('profiles').update({ full_name: storedName }).eq('id', user.id)
        }
      }
      localStorage.removeItem('banglan_full_name')
    }

    setup()
  }, [])

  return null
}
