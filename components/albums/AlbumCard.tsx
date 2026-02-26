'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Image, Camera } from 'lucide-react'
import { format } from 'date-fns'
import type { Album } from '@/types'

interface AlbumCardProps {
  album: Album
  index?: number
}

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  if (error) return <div style={{ position: 'absolute', inset: 0, background: 'var(--secondary)' }} />
  return (
    <>
      {!loaded && <div style={{ position: 'absolute', inset: 0, background: 'var(--secondary)' }} className="animate-pulse" />}
      <img
        src={src} alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  )
}

const TILE_RADIUS = '14px'
const TILE_GAP = '3px'

function Tile({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: 0, borderRadius: TILE_RADIUS, ...style }}>
      <CoverImage src={src} alt={alt} />
    </div>
  )
}

export function AlbumCard({ album, index = 0 }: AlbumCardProps) {
  const rawPhotos = album.cover_photos && album.cover_photos.length > 0 ? [...album.cover_photos] : []
  if (rawPhotos.length === 0) {
    const fallbackUrl = album.cover_photo_url || album.first_photo_url
    if (fallbackUrl) rawPhotos.push(fallbackUrl)
  }
  const photos = rawPhotos.filter(Boolean)
  const count = photos.length

  return (
    <Link href={`/albums/${album.id}`} className="group block">
      <div className="relative overflow-hidden rounded-3xl bg-secondary shadow-sm hover:shadow-[0_0_30px_oklch(0.75_0.17_68/0.15)] transition-all duration-300 hover:-translate-y-1">
        <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '4/3', borderRadius: '1.5rem' }}>
          {count === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5">
              <div className="flex flex-col items-center gap-2 text-primary/30">
                <Camera className="w-10 h-10" />
                <span className="text-xs font-medium">No photos yet</span>
              </div>
            </div>
          )}
          {count === 1 && (
            <div style={{ position: 'absolute', inset: 0 }} className="group-hover:scale-105 transition-transform duration-700">
              <CoverImage src={photos[0]} alt={album.title} />
            </div>
          )}
          {count === 2 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: TILE_GAP, padding: TILE_GAP }}
              className="group-hover:scale-105 transition-transform duration-700">
              <Tile src={photos[0]} alt={album.title} style={{ flex: 1 }} />
              <Tile src={photos[1]} alt={album.title} style={{ flex: 1 }} />
            </div>
          )}
          {count === 3 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', gap: TILE_GAP, padding: TILE_GAP }}
              className="group-hover:scale-105 transition-transform duration-700">
              <Tile src={photos[0]} alt={album.title} style={{ flex: 3 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: TILE_GAP, flex: 2, minWidth: 0 }}>
                <Tile src={photos[1]} alt={album.title} style={{ flex: 1 }} />
                <Tile src={photos[2]} alt={album.title} style={{ flex: 1 }} />
              </div>
            </div>
          )}
          {count === 4 && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: TILE_GAP, padding: TILE_GAP }}
              className="group-hover:scale-105 transition-transform duration-700">
              {photos.slice(0, 4).map((url, i) => <Tile key={i} src={url} alt={album.title} />)}
            </div>
          )}
          {count >= 5 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: TILE_GAP, padding: TILE_GAP }}
              className="group-hover:scale-105 transition-transform duration-700">
              <Tile src={photos[0]} alt={album.title} style={{ flex: 55, minHeight: 0 }} />
              <div style={{ display: 'flex', gap: TILE_GAP, flex: 45, minHeight: 0 }}>
                {photos.slice(1, 5).map((url, i) => <Tile key={i} src={url} alt={album.title} style={{ flex: 1 }} />)}
              </div>
            </div>
          )}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '1.5rem', boxShadow: 'inset 0 0 30px 8px rgba(0,0,0,0.15)' }} />
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} className="bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
          <div style={{ position: 'absolute', top: 12, right: 12 }}
            className="bg-black/50 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
            <Image className="w-3 h-3" />
            {album.photo_count ?? 0}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
            <h3 className="text-white font-bold text-lg leading-tight mb-0.5 drop-shadow-md font-rock tracking-wide">
              {album.title}
            </h3>
            <p className="text-white/80 text-xs font-mono drop-shadow-sm">
              {(() => {
                if (album.earliest_taken_at) {
                  const earliest = format(new Date(album.earliest_taken_at), 'MMM yyyy')
                  const latest = album.latest_taken_at ? format(new Date(album.latest_taken_at), 'MMM yyyy') : earliest
                  return earliest === latest ? earliest : `${earliest} – ${latest}`
                }
                return format(new Date(album.updated_at), 'MMMM yyyy')
              })()}
            </p>
          </div>
        </div>
        {album.description && (
          <div className="px-4 py-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground line-clamp-2">{album.description}</p>
          </div>
        )}
      </div>
    </Link>
  )
}
