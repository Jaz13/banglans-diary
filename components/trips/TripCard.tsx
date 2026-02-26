'use client'

import Link from 'next/link'
import { MapPin, Calendar, Users, Check, HelpCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Trip } from '@/types'

interface TripCardProps {
  trip: Trip
  currentUserId: string
}

export function TripCard({ trip, currentUserId }: TripCardProps) {
  const rsvps = trip.rsvps ?? []
  const going = rsvps.filter(r => r.status === 'going')
  const maybe = rsvps.filter(r => r.status === 'maybe')
  const myRsvp = rsvps.find(r => r.user_id === currentUserId)

  const statusColors: Record<string, string> = {
    planning: 'bg-primary/10 text-primary border-primary/20',
    confirmed: 'bg-accent/10 text-accent border-accent/20',
    completed: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  }

  return (
    <Link href={`/trips/${trip.id}`} className="group block">
      <div className="bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/30 hover:shadow-[0_0_30px_oklch(0.75_0.17_68/0.12)] transition-all duration-300">
        {trip.cover_photo_url && (
          <div className="relative h-40 overflow-hidden">
            <img src={trip.cover_photo_url} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusColors[trip.status] || statusColors.planning}`}>
                {trip.status}
              </span>
            </div>
          </div>
        )}
        <div className="p-5">
          {!trip.cover_photo_url && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize mb-3 inline-block ${statusColors[trip.status] || statusColors.planning}`}>
              {trip.status}
            </span>
          )}
          <h3 className="text-lg font-bold text-foreground font-rock tracking-wide mb-1">{trip.title}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
            <span>{trip.destination}</span>
          </div>
          {(trip.confirmed_start || trip.proposed_dates?.length) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 font-mono">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {trip.confirmed_start
                ? `${format(new Date(trip.confirmed_start), 'MMM d')}${trip.confirmed_end ? ` – ${format(new Date(trip.confirmed_end), 'MMM d, yyyy')}` : ''}`
                : `${trip.proposed_dates!.length} date${trip.proposed_dates!.length > 1 ? 's' : ''} proposed`}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-accent font-medium">
                <Check className="w-3.5 h-3.5" />
                {going.length} going
              </div>
              {maybe.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {maybe.length} maybe
                </div>
              )}
            </div>
            {myRsvp && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                myRsvp.status === 'going' ? 'bg-accent/10 text-accent' :
                myRsvp.status === 'maybe' ? 'bg-primary/10 text-primary' :
                'bg-destructive/10 text-destructive'
              }`}>
                You: {myRsvp.status === 'not_going' ? 'Can\'t go' : myRsvp.status}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
