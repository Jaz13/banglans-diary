import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { GlobalUploadModal } from '@/components/layout/GlobalUploadModal'
import { RockBackground } from '@/components/decorative/RockBackground'

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
      <RockBackground />
      <Navbar user={profile} />
      <main className="lg:pt-16 mobile-nav-spacer">
        {children}
      </main>
      {profile?.role === 'admin' && <GlobalUploadModal />}
    </div>
  )
}
