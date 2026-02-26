'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cake } from 'lucide-react'

interface BirthdayProfile {
  id: string
  full_name: string
  nickname: string | null
  birthday: string | null
}

export function BirthdayBanner() {
  const [todayBirthdays, setTodayBirthdays] = useState<BirthdayProfile[]>([])
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayProfile[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, birthday')
        .not('birthday', 'is', null)

      if (!data) return

      const now = new Date()
      const todayMD = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // Next 7 days
      const upcoming: BirthdayProfile[] = []
      const today: BirthdayProfile[] = []

      data.forEach((p) => {
        if (!p.birthday) return
        // birthday stored as YYYY-MM-DD or MM-DD
        const parts = p.birthday.split('-')
        const md = parts.length === 3 ? `${parts[1]}-${parts[2]}` : p.birthday

        if (md === todayMD) {
          today.push(p)
        } else {
          // Check if within next 7 days
          const thisYear = now.getFullYear()
          const bdDate = new Date(`${thisYear}-${md}`)
          if (bdDate < now) bdDate.setFullYear(thisYear + 1)
          const diffDays = Math.ceil((bdDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays <= 7) upcoming.push({ ...p, _days: diffDays } as any)
        }
      })

      setTodayBirthdays(today)
      setUpcomingBirthdays(upcoming.sort((a: any, b: any) => a._days - b._days))
    }
    load()
  }, [])

  if (todayBirthdays.length === 0 && upcomingBirthdays.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      {todayBirthdays.map(p => (
        <div
          key={p.id}
          className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-2xl px-4 py-3 animate-in fade-in duration-300"
          style={{ boxShadow: '0 0 20px oklch(0.75 0.17 68 / 0.15)' }}
        >
          <span className="text-2xl animate-bounce">🎂</span>
          <div>
            <p className="text-sm font-bold text-primary" style={{ fontFamily: 'var(--font-rock)', letterSpacing: '0.05em' }}>
              HAPPY BIRTHDAY {(p.nickname || p.full_name).toUpperCase()}! 🤘
            </p>
            <p className="text-xs text-muted-foreground">Wishing the legend a rock &apos;n&apos; roll birthday!</p>
          </div>
          <Cake className="w-5 h-5 text-primary ml-auto shrink-0" />
        </div>
      ))}
      {upcomingBirthdays.slice(0, 2).map((p: any) => (
        <div
          key={p.id}
          className="flex items-center gap-3 bg-secondary border border-border rounded-2xl px-4 py-3"
        >
          <span className="text-lg">🎂</span>
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{p.nickname || p.full_name}</span>
            {`'s birthday in `}
            <span className="text-primary font-mono">{p._days} day{p._days !== 1 ? 's' : ''}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
