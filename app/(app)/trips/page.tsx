'use client'

import { useState, useEffect } from 'react'
import { Plus, Plane } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { TripCard } from '@/components/trips/TripCard'
import type { Trip } from '@/types'

export default function TripsPage() {
  const { user, isAdmin } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDest, setNewDest] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/trips')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setTrips(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newDest.trim()) return
    setCreating(true)
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), destination: newDest.trim(), description: newDesc.trim() || null }),
    })
    if (res.ok) {
      const newTrip = await res.json()
      setTrips(prev => [newTrip, ...prev])
      setNewTitle('')
      setNewDest('')
      setNewDesc('')
      setShowCreate(false)
    }
    setCreating(false)
  }

  const activeTrips = trips.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const pastTrips = trips.filter(t => t.status === 'completed' || t.status === 'cancelled')

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-1 font-rock tracking-wide">
            TRIPS <span className="text-2xl opacity-70">✈️</span>
          </h1>
          <div className="rock-divider mb-2" />
          <p className="text-muted-foreground">Plan the next Banglan expedition</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-bold text-sm hover:bg-primary/90 transition-colors font-rock tracking-widest"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">NEW TRIP</span>
          </button>
        )}
      </div>

      {showCreate && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border animate-in zoom-in-95 duration-250">
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground font-rock tracking-wide">NEW TRIP</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Trip Name</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g. Goa Beach Trip 2025"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Destination</label>
                <input value={newDest} onChange={e => setNewDest(e.target.value)} required placeholder="e.g. Goa, Kerala, Dubai..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={2} placeholder="What's the plan?"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newTitle.trim() || !newDest.trim()}
                  className="flex-1 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors font-rock tracking-widest">
                  {creating ? 'CREATING...' : 'CREATE TRIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl bg-secondary animate-pulse h-48" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Plane className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2 font-rock tracking-wide">NO TRIPS YET</h2>
          <p className="text-muted-foreground mb-6">Plan the first Banglan expedition!</p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors font-rock tracking-widest">
              <Plus className="w-4 h-4" />
              CREATE FIRST TRIP
            </button>
          )}
        </div>
      )}

      {!loading && activeTrips.length > 0 && (
        <>
          <div className="rock-divider mb-5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            {activeTrips.map((trip, i) => (
              <div key={trip.id} className="animate-in fade-in slide-in-from-bottom-3 duration-400"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                <TripCard trip={trip} currentUserId={user?.id || ''} />
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && pastTrips.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-muted-foreground mb-4 font-rock tracking-wide">PAST TRIPS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 opacity-60">
            {pastTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} currentUserId={user?.id || ''} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
