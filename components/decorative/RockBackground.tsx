'use client'
import { CassetteSVG } from './CassetteSVG'
import { GuitarPickSVG } from './GuitarPickSVG'
import { BananaLeafSVG } from './BananaLeafSVG'
import { VinylSVG } from './VinylSVG'

export function RockBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
      {/* Cassette tapes */}
      <div className="absolute top-6 right-10 text-primary" style={{ opacity: 0.055, transform: 'rotate(12deg)' }}>
        <CassetteSVG width={140} />
      </div>
      <div className="absolute bottom-36 left-6 text-primary" style={{ opacity: 0.04, transform: 'rotate(-6deg)' }}>
        <CassetteSVG width={100} />
      </div>
      <div className="absolute top-1/2 right-4 text-muted-foreground" style={{ opacity: 0.03, transform: 'rotate(20deg) translateY(-50%)' }}>
        <CassetteSVG width={75} />
      </div>

      {/* Guitar picks */}
      <div className="absolute top-1/3 right-8 text-primary" style={{ opacity: 0.07, transform: 'rotate(45deg)' }}>
        <GuitarPickSVG width={42} />
      </div>
      <div className="absolute top-2/3 left-5 text-primary" style={{ opacity: 0.055, transform: 'rotate(-20deg)' }}>
        <GuitarPickSVG width={28} />
      </div>
      <div className="absolute top-16 left-16 text-muted-foreground" style={{ opacity: 0.04, transform: 'rotate(60deg)' }}>
        <GuitarPickSVG width={22} />
      </div>

      {/* Kerala banana leaves — bottom corners */}
      <div className="absolute bottom-0 left-0 text-accent" style={{ opacity: 0.065 }}>
        <BananaLeafSVG width={160} />
      </div>
      <div className="absolute bottom-0 right-0 text-accent" style={{ opacity: 0.05, transform: 'scaleX(-1)' }}>
        <BananaLeafSVG width={120} />
      </div>

      {/* Vinyl record ghost — center background */}
      <div className="absolute top-1/2 left-1/2 text-primary" style={{
        opacity: 0.025,
        transform: 'translate(-50%, -50%)',
        animation: 'vinyl-pulse 25s linear infinite',
      }}>
        <VinylSVG width={420} />
      </div>
    </div>
  )
}
