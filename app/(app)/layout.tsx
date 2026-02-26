import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { GlobalUploadModal } from '@/components/layout/GlobalUploadModal'
import { RockBackground } from '@/components/decorative/RockBackground'
import { PostAuthSetup } from '@/components/auth/PostAuthSetup'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen">
      <PostAuthSetup />
      <RockBackground />
      <Navbar user={profile} />
      <main className="lg:pt-16 mobile-nav-spacer">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10 pb-16">
          {children}
        </div>
      </main>
      {profile?.role === 'admin' && <GlobalUploadModal />}
    </div>
  )
}
