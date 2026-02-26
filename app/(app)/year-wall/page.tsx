'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import type { Photo } from '@/types'
import { format, startOfYear, endOfYear, eachDayOfInterval, isToday, isFuture } from 'date-fns'

export default function YearWallPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [photosByDay, setPhotosByDay] = useState<Map<string, Photo[]>>(new Map())
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [userRole, setUserRole] = useState('')
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile) setUserRole(profile.role)
      }
      const { data } = await supabase
        .from('photos')
        .select('*, uploader:profiles(*), likes(user_id), comments(count)')
        .order('created_at', { ascending: false })
      if (!data) { setLoading(false); return }
      const enriched: Photo[] = data.map((p: any) => ({
        ...p,
        likes_count: p.likes?.length ?? 0,
        user_has_liked: user ? p.likes?.some((l: any) => l.user_id === user.id) : false,
        comments_count: p.comments?.[0]?.count ?? 0,
      }))
      setPhotos(enriched)
      const map = new Map<string, Photo[]>()
      for (const p of enriched) {
        const d = new Date(p.taken_at || p.created_at)
        const key = format(d, 'yyyy-MM-dd')
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(p)
      }
      setPhotosByDay(map)
      setLoading(false)
    }
    load()
  }, [year])

  const days = eachDayOfInterval({
    start: startOfYear(new Date(year, 0, 1)),
    end: endOfYear(new Date(year, 0, 1)),
  })

  const months: { name: string; days: Date[] }[] = []
  let currentMonth = -1
  for (const day of days) {
    const m = day.getMonth()
    if (m !== currentMonth) { months.push({ name: format(day, 'MMM'), days: [] }); currentMonth = m }
    months[months.length - 1].days.push(day)
  }

  const maxPhotos = Math.max(...Array.from(photosByDay.values()).map(p => p.length), 1)

  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-secondary hover:bg-secondary/80'
    const ratio = count / maxPhotos
    if (ratio < 0.25) return 'bg-primary/20 hover:bg-primary/30'
    if (ratio < 0.5) return 'bg-primary/40 hover:bg-primary/50'
    if (ratio < 0.75) return 'bg-primary/65 hover:bg-primary/75'
    return 'bg-primary hover:bg-primary/90'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1 font-rock tracking-wide">
            THE YEAR WALL
          </h1>
          <div className="rock-divider mb-2" />
          <p className="text-muted-foreground">Every day of {year} — click a day to relive it</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)}
            className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-mono">
            ← {year - 1}
          </button>
          <span className="text-sm font-bold text-foreground px-2 font-mono">{year}</span>
          {year < new Date().getFullYear() && (
            <button onClick={() => setYear(y => y + 1)}
              className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors font-mono">
              {year + 1} →
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-12 gap-2">
          {Array.from({ length: 52 }).map((_, i) => (
            <div key={i} className="space-y-1">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="w-full aspect-square rounded-sm bg-secondary animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[700px]">
              <div className="flex mb-2">
                {months.map((m) => (
                  <div key={m.name} className="text-xs text-muted-foreground font-medium font-mono"
                    style={{ width: `${(m.days.length / days.length) * 100}%` }}>
                    {m.name}
                  </div>
                ))}
              </div>
              <div className="flex gap-1 flex-wrap" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.ceil(days.length / 7)}, minmax(0, 1fr))`, gap: '3px' }}>
                {(() => {
                  const weeks: (Date | null)[][] = []
                  let week: (Date | null)[] = []
                  const firstDay = days[0].getDay()
                  for (let i = 0; i < firstDay; i++) week.push(null)
                  for (const day of days) {
                    week.push(day)
                    if (week.length === 7) { weeks.push(week); week = [] }
                  }
                  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week) }
                  return (
                    <div className="flex gap-1">
                      {weeks.map((wk, wi) => (
                        <div key={wi} className="flex flex-col gap-1">
                          {wk.map((day, di) => {
                            if (!day) return <div key={di} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            const key = format(day, 'yyyy-MM-dd')
                            const dayPhotos = photosByDay.get(key) || []
                            const count = dayPhotos.length
                            const future = isFuture(day) && !isToday(day)
                            return (
                              <div key={di} className="relative group/day">
                                <button
                                  onClick={() => { if (count > 0) { setSelectedPhoto(dayPhotos[0]); setSelectedPhotos(dayPhotos) } }}
                                  disabled={count === 0 || future}
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-all duration-150 ${
                                    future ? 'bg-secondary/40 cursor-default opacity-30' :
                                    count > 0 ? `${getIntensity(count)} cursor-pointer ring-1 ring-primary/20` :
                                    'bg-secondary/60 cursor-default'
                                  } ${isToday(day) ? 'ring-2 ring-primary shadow-[0_0_8px_oklch(0.75_0.17_68/0.5)]' : ''}`}
                                  title={`${format(day, 'MMM d')}${count > 0 ? ` · ${count} moment${count > 1 ? 's' : ''}` : ''}`}
                                />
                                {count > 0 && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none opacity-0 group-hover/day:opacity-100 transition-opacity duration-150">
                                    <div className="bg-foreground text-background text-xs px-2 py-1 rounded-lg whitespace-nowrap shadow-lg font-mono">
                                      {format(day, 'MMM d')} · {count} moment{count > 1 ? 's' : ''}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground font-mono">
                <span>Less</span>
                <div className="flex gap-1">
                  {['bg-secondary/60', 'bg-primary/20', 'bg-primary/40', 'bg-primary/65', 'bg-primary'].map((c, i) => (
                    <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Days captured', value: photosByDay.size },
              { label: 'Total moments', value: photos.filter(p => new Date(p.taken_at || p.created_at).getFullYear() === year).length },
              { label: 'Busiest month', value: (() => {
                const byMonth = new Array(12).fill(0)
                for (const [key, ps] of photosByDay) { if (new Date(key).getFullYear() === year) byMonth[new Date(key).getMonth()] += ps.length }
                const max = Math.max(...byMonth)
                if (max === 0) return '—'
                return format(new Date(year, byMonth.indexOf(max), 1), 'MMMM')
              })() },
              { label: 'Active streak', value: (() => {
                let streak = 0, best = 0
                const sortedKeys = Array.from(photosByDay.keys()).sort()
                for (let i = 0; i < sortedKeys.length; i++) {
                  if (i === 0) { streak = 1; best = 1; continue }
                  const prev = new Date(sortedKeys[i-1])
                  const curr = new Date(sortedKeys[i])
                  const diff = (curr.getTime() - prev.getTime()) / 86400000
                  if (diff === 1) { streak++; best = Math.max(best, streak) } else streak = 1
                }
                return best > 0 ? `${best} days` : '—'
              })() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-4">
                <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto} photos={selectedPhotos}
          onClose={() => { setSelectedPhoto(null); setSelectedPhotos([]) }}
          onNavigate={setSelectedPhoto}
          currentUserId={currentUserId} userRole={userRole}
        />
      )}
    </div>
  )
}
