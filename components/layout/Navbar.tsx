'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Guitar, Image, BookOpen, Calendar, Map, Trophy, Music, MessageSquare, Users, Settings, LogOut, Plus, Menu, X } from 'lucide-react'
import type { User } from '@/types'

interface NavbarProps { user: User | null }

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Photos', icon: Image },
  { href: '/albums', label: 'Albums', icon: BookOpen },
  { href: '/year-wall', label: 'Year Wall', icon: Calendar },
  { href: '/trips', label: 'Trips', icon: Map },
  { href: '/wall-of-fame', label: 'Wall', icon: Trophy },
  { href: '/soundtrack', label: 'Sounds', icon: Music },
  { href: '/board', label: 'Board', icon: MessageSquare },
]

const MOBILE_MAIN = ['/dashboard', '/albums', '/trips', '/board']

function getInitials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const openUpload = () => {
    window.dispatchEvent(new CustomEvent('open-upload-modal'))
    setMenuOpen(false)
  }

  return (
    <>
      {/* Desktop top navbar */}
      <header className="glass-nav fixed top-0 left-0 right-0 z-40 hidden lg:block">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <Guitar className="w-5 h-5 text-primary" />
            <span className="font-rock text-xl neon-flicker">BANGLANS DIARY</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link key={href} href={href} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${active ? 'bg-primary/15 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <button onClick={openUpload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all">
                <Plus className="w-3.5 h-3.5" />
                Add Photo
              </button>
            )}
            <div className="relative group">
              <button className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-secondary transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center border border-primary/20">
                  {getInitials(user?.full_name)}
                </div>
                <span className="text-xs text-muted-foreground max-w-24 truncate">{user?.nickname || user?.full_name?.split(' ')[0]}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                  <Settings className="w-4 h-4" /><span>Settings</span>
                </Link>
                {isAdmin && (
                  <Link href="/invite-members" className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                    <Users className="w-4 h-4" /><span>Invite Members</span>
                  </Link>
                )}
                <div className="my-1 border-t border-border" />
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-secondary transition-colors">
                  <LogOut className="w-4 h-4" /><span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-border pb-safe">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {MOBILE_MAIN.map(href => {
            const item = NAV_ITEMS.find(n => n.href === href)!
            const Icon = item.icon
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <button onClick={openUpload} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-primary">
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center -mt-4 shadow-lg amber-glow">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium text-primary mt-0.5">Upload</span>
            </button>
          )}
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground">
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile more menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="relative bg-card rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">{getInitials(user?.full_name)}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role} · {user?.location || 'Banglan'}</p>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1">
              {[
                { href: '/wall-of-fame', label: 'Wall of Fame', icon: Trophy },
                { href: '/soundtrack', label: 'Banglan Mixtape', icon: Music },
                { href: '/year-wall', label: 'Year Wall', icon: Calendar },
                { href: '/settings', label: 'Settings', icon: Settings },
                ...(isAdmin ? [{ href: '/invite-members', label: 'Invite Members', icon: Users }] : []),
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">{label}</span>
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors">
                <LogOut className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
