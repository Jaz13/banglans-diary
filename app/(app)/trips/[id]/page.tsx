'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, MapPin, Calendar, Package, FileText, Plus, Check, Loader2, Pencil, Save } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuth } from '@/components/providers/AuthProvider'
import { RsvpButtons } from '@/components/trips/RsvpButtons'
import { DateVoteCard } from '@/components/trips/DateVoteCard'
import type { Trip, TripRsvp } from '@/types'

export default function TripDetailPage() {
  const { user, isAdmin } = useAuth()
  const params = useParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [myRsvp, setMyRsvp] = useState<TripRsvp | null>(null)
  const [newPackingItem, setNewPackingItem] = useState('')
  const [addingItem, setAddingItem] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/trips/${tripId}`)
      if (res.ok) {
        const data = await res.json()
        setTrip(data)
        setNotesValue(data.notes || '')
        if (user && data.rsvps) {
          const found = data.rsvps.find((r: TripRsvp) => r.user_id === user.id)
          setMyRsvp(found || null)
        }
      }
      setLoading(false)
    }
    load()
  }, [tripId, user])

  const handleRsvpUpdate = async (status: 'going' | 'maybe' | 'not_going') => {
    setMyRsvp(prev => prev ? { ...prev, status } : { id: '', trip_id: tripId, user_id: user?.id || '', status, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    const res = await fetch(`/api/trips/${tripId}`)
    if (res.ok) { const data = await res.json(); setTrip(data) }
  }

  const handleDateVote = async (dateIndex: number, userId: string) => {
    if (!trip?.proposed_dates) return
    const updated = trip.proposed_dates.map((d, i) => {
      if (i !== dateIndex) return d
      const votes = d.votes || []
      const hasVoted = votes.includes(userId)
      return { ...d, votes: hasVoted ? votes.filter(v => v !== userId) : [...votes, userId] }
    })
    setTrip(prev => prev ? { ...prev, proposed_dates: updated } : prev)
  }

  const handleTogglePacking = async (itemIndex: number) => {
    if (!trip?.packing_list) return
    const updated = trip.packing_list.map((item, i) =>
      i === itemIndex ? { ...item, checked: !item.checked } : item
    )
    setTrip(prev => prev ? { ...prev, packing_list: updated } : prev)
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packing_list: updated }),
    })
  }

  const handleAddPackingItem = async () => {
    if (!newPackingItem.trim()) return
    setAddingItem(true)
    const currentList = trip?.packing_list || []
    const updated = [...currentList, { item: newPackingItem.trim(), checked: false }]
    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packing_list: updated }),
    })
    if (res.ok) { setTrip(prev => prev ? { ...prev, packing_list: updated } : prev); setNewPackingItem('') }
    setAddingItem(false)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    const res = await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesValue }),
    })
    if (res.ok) { setTrip(prev => prev ? { ...prev, notes: notesValue } : prev); setEditingNotes(false) }
    setSavingNotes(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!trip) return <div className="text-center py-20 text-muted-foreground">Trip not found</div>

  const going = (trip.rsvps || []).filter(r => r.status === 'going')
  const maybe = (trip.rsvps || []).filter(r => r.status === 'maybe')
  const notGoing = (trip.rsvps || []).filter(r => r.status === 'not_going')

  return (
    <div className="max-w-2xl">
      <Link href="/trips" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" />
        All Trips
      </Link>

      {trip.cover_photo_url && (
        <div className="relative h-48 rounded-3xl overflow-hidden mb-6">
          <img src={trip.cover_photo_url} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
      )}

      <h1 className="text-3xl font-bold text-foreground mb-2 font-rock tracking-wide">{trip.title}</h1>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" />{trip.destination}</span>
        {trip.confirmed_start && (
          <span className="flex items-center gap-1 font-mono"><Calendar className="w-3.5 h-3.5" />
            {format(new Date(trip.confirmed_start), 'MMM d')}
            {trip.confirmed_end ? ` – ${format(new Date(trip.confirmed_end), 'MMM d, yyyy')}` : ''}
          </span>
        )}
      </div>
      {trip.description && <p className="text-muted-foreground mb-6 leading-relaxed">{trip.description}</p>}
      <div className="rock-divider mb-6" />

      {/* RSVP section */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 font-rock tracking-wide flex items-center gap-2">
          <span className="text-xl">🙋</span> RSVP
        </h2>
        <RsvpButtons currentStatus={myRsvp?.status} tripId={tripId} onUpdate={handleRsvpUpdate} />
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Going', count: going.length, color: 'text-accent' },
            { label: 'Maybe', count: maybe.length, color: 'text-primary' },
            { label: "Can't go", count: notGoing.length, color: 'text-muted-foreground' },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-secondary rounded-2xl p-3 text-center">
              <p className={`text-2xl font-bold font-mono ${color}`}>{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {going.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {going.map(r => (
              <div key={r.id} className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
                <div className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent">
                  {r.user?.full_name?.[0] ?? '?'}
                </div>
                <span className="text-xs text-foreground">{r.user?.full_name || 'Banglan'}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Date voting */}
      {trip.proposed_dates && trip.proposed_dates.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 font-rock tracking-wide flex items-center gap-2">
            <span className="text-xl">📅</span> DATE VOTING
          </h2>
          <div className="space-y-3">
            {trip.proposed_dates.map((pd, i) => (
              <DateVoteCard key={i} proposedDate={pd} dateIndex={i} tripId={tripId} currentUserId={user?.id || ''} onVote={handleDateVote} />
            ))}
          </div>
        </section>
      )}

      {/* Packing list */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 font-rock tracking-wide flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> PACKING LIST
        </h2>
        {(!trip.packing_list || trip.packing_list.length === 0) && (
          <p className="text-sm text-muted-foreground mb-4">No items yet. Add what to pack!</p>
        )}
        <div className="space-y-2 mb-3">
          {(trip.packing_list || []).map((item, i) => (
            <button key={i} onClick={() => handleTogglePacking(i)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left">
              <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                item.checked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
              }`}>
                {item.checked && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{item.item}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newPackingItem} onChange={e => setNewPackingItem(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPackingItem() } }}
            placeholder="Add an item..."
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30" />
          <button onClick={handleAddPackingItem} disabled={!newPackingItem.trim() || addingItem}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </section>

      {/* Notes */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground font-rock tracking-wide flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> NOTES
          </h2>
          {isAdmin && !editingNotes && (
            <button onClick={() => setEditingNotes(true)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        {editingNotes ? (
          <div className="space-y-3">
            <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={5} placeholder="Shared notes for this trip..."
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            <div className="flex gap-2">
              <button onClick={handleSaveNotes} disabled={savingNotes}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => { setEditingNotes(false); setNotesValue(trip.notes || '') }}
                className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-secondary rounded-2xl p-4 min-h-16">
            {trip.notes ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{trip.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">{isAdmin ? 'Click the pencil to add notes...' : 'No notes yet.'}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
