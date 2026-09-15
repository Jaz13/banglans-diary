'use client'

import { NowPlaying } from '@/components/soundtrack/NowPlaying'
import { usePlayer } from '@/components/providers/PlayerContext'

export function PersistentPlayer() {
  const { currentSong, hasNext, hasPrev, closePlayer, next, prev } = usePlayer()

  if (!currentSong) return null

  return (
    <NowPlaying
      song={currentSong}
      onClose={closePlayer}
      onNext={next}
      onPrev={prev}
      hasNext={hasNext}
      hasPrev={hasPrev}
      onEnded={() => (hasNext ? next() : closePlayer())}
    />
  )
}
