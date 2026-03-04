import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { PlayerProvider } from '@/components/providers/PlayerContext'
import { ProfileMissing } from '@/components/auth/ProfileMissing'
import {
  LazyPersistentPlayer,
  LazyGlobalUploadModal,
  LazyRockBackground,
  LazyPostAuthSetup,
} from '@/components/layout/LazyComponents'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  // getSession() reads from cookie (no network call), saves ~200ms vs getUser()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) redirect('/login')
  const user = session.user

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist yet (signup profile creation failed),
  // show a friendly recovery screen instead of a broken dashboard
  if (!profile) {
    return (
      <AuthProvider user={null}>
        <ProfileMissing userEmail={user.email || ''} userId={user.id} />
      </AuthProvider>
    )
  }

  return (
    <AuthProvider user={profile}>
      <PlayerProvider>
        <div className="min-h-screen">
          <LazyPostAuthSetup />
          <LazyRockBackground />
          <Navbar user={profile} />
          <main className="lg:pt-16 mobile-nav-spacer">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-28 lg:pb-16">
              {children}
            </div>
          </main>
          {profile?.role === 'admin' && <LazyGlobalUploadModal />}
          {/* Persistent player — survives page navigation */}
          <LazyPersistentPlayer />
        </div>
      </PlayerProvider>
    </AuthProvider>
  )
}
