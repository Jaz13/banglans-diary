'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Stethoscope, Users } from 'lucide-react'

interface Member {
  id: string
  full_name: string
  nickname: string | null
  location: string | null
  specialty: string | null
  role: string
  birthday: string | null
}

// Map location to flag emoji
const LOCATION_FLAGS: Record<string, string> = {
  'Calicut': '🇮🇳', 'Thrissur': '🇮🇳', 'Kochi': '🇮🇳', 'Trivandrum': '🇮🇳',
  'Bangalore': '🇮🇳', 'Chennai': '🇮🇳', 'Hyderabad': '🇮🇳', 'Mumbai': '🇮🇳',
  'Delhi': '🇮🇳', 'Dubai': '🇦🇪', 'Qatar': '🇶🇦', 'UK': '🇬🇧',
  'USA': '🇺🇸', 'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Other': '🌍',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = [
  'bg-amber-500', 'bg-emerald-500', 'bg-sky-500', 'bg-violet-500',
  'bg-rose-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-lime-500', 'bg-cyan-500', 'bg-fuchsia-500',
  'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500',
]

function getMemberColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// Group members by location
function groupByLocation(members: Member[]) {
  const groups: Record<string, Member[]> = {}
  members.forEach(m => {
    const loc = m.location || 'Unknown'
    if (!groups[loc]) groups[loc] = []
    groups[loc].push(m)
  })
  return groups
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'map' | 'grid'>('map')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, nickname, location, specialty, role, birthday')
        .order('full_name')
      if (data) setMembers(data)
      setLoading(false)
    }
    load()
  }, [])

  const grouped = groupByLocation(members)
  const locationOrder = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unknown') return 1
    if (b === 'Unknown') return -1
    return grouped[b].length - grouped[a].length
  })

  return (
    <>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-primary mb-1 tracking-wide neon-flicker"
            style={{ fontFamily: 'var(--font-rock)' }}
          >
            THE BANGLANS
          </h1>
          <div className="rock-divider mb-3" />
          <p className="text-muted-foreground">
            {members.length} legends spread across the globe 🌍
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
              view === 'map' ? 'bg-primary/15 text-primary border-primary/40' : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            By Location
          </button>
          <button
            onClick={() => setView('grid')}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border transition-all ${
              view === 'grid' ? 'bg-primary/15 text-primary border-primary/40' : 'bg-secondary text-muted-foreground border-border'
            }`}
          >
            All Members
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-secondary animate-pulse h-36" />
          ))}
        </div>
      )}

      {/* Map view — grouped by location */}
      {!loading && view === 'map' && (
        <div className="space-y-8">
          {locationOrder.map(loc => (
            <div key={loc}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{LOCATION_FLAGS[loc] || '🌍'}</span>
                <h2 className="text-sm font-mono font-bold text-foreground uppercase tracking-widest">{loc}</h2>
                <span className="text-xs font-mono text-muted-foreground">— {grouped[loc].length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {grouped[loc].map(m => (
                  <MemberCard key={m.id} member={m} color={getMemberColor(m.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid view — all members */}
      {!loading && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map(m => (
            <MemberCard key={m.id} member={m} color={getMemberColor(m.id)} />
          ))}
        </div>
      )}

      {!loading && members.length === 0 && (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-rock text-2xl text-foreground tracking-wide mb-2">NO BANGLANS YET</h2>
          <p className="text-muted-foreground">Invite the legends first!</p>
        </div>
      )}
    </>
  )
}

function MemberCard({ member, color }: { member: Member; color: string }) {
  const displayName = member.nickname || member.full_name
  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-[0_0_15px_oklch(0.75_0.17_68/0.08)] transition-all duration-200">
      <div className="flex flex-col items-center text-center gap-2">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {getInitials(member.full_name)}
        </div>
        {/* Name */}
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{member.full_name}</p>
          {member.nickname && (
            <p className="text-xs text-primary font-mono mt-0.5">"{member.nickname}"</p>
          )}
        </div>
        {/* Details */}
        <div className="space-y-1 w-full">
          {member.specialty && (
            <div className="flex items-center justify-center gap-1">
              <Stethoscope className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground truncate">{member.specialty}</p>
            </div>
          )}
          {member.location && (
            <div className="flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              <p className="text-[11px] text-muted-foreground">{member.location}</p>
            </div>
          )}
        </div>
        {/* Admin badge */}
        {member.role === 'admin' && (
          <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5 uppercase tracking-wider">
            ⚡ Admin
          </span>
        )}
      </div>
    </div>
  )
}
