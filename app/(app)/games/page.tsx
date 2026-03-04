'use client'

import Link from 'next/link'
import { Gamepad2, Link2, ArrowLeft } from 'lucide-react'

const games = [
  {
    href: '/games/word-chain',
    icon: Link2,
    title: 'Word Chain Battle',
    tagline: 'Think fast or the clock wins',
    description: 'Each word must start with the last letter of the previous one. Power-ups, categories, and a ticking timer. Solo vs AI or challenge a Banglan live.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

export default function GamesPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1 font-display tracking-wide">
          GAMES
        </h1>
        <div className="rock-divider mb-2" />
        <p className="text-muted-foreground">
          Take a break and play with your fellow Banglans
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
        {games.map(({ href, icon: Icon, title, tagline, description, color, bg }) => (
          <Link
            key={href}
            href={href}
            className="group rock-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-6">
              <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-7 h-7 ${color}`} />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1 font-display tracking-wide">
                {title}
              </h2>
              <p className="text-sm text-primary font-medium mb-2 italic">{tagline}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <div className="px-6 py-3 border-t border-border bg-secondary/30">
              <span className="text-xs text-primary font-medium group-hover:underline">
                Play now &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
