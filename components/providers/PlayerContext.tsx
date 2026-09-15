'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { SoundtrackSong } from '@/types'

interface PlayerContextValue {
  currentSong: SoundtrackSong | null
  queue: SoundtrackSong[]
  currentIndex: number
  hasNext: boolean
  hasPrev: boolean
  playSong: (song: SoundtrackSong, queue?: SoundtrackSong[]) => void
  closePlayer: () => void
  next: () => void
  prev: () => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<SoundtrackSong[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const playSong = useCallback((song: SoundtrackSong, list?: SoundtrackSong[]) => {
    const nextQueue = list && list.length > 0 ? list : [song]
    const idx = nextQueue.findIndex((s) => s.id === song.id)
    setQueue(nextQueue)
    setCurrentIndex(idx >= 0 ? idx : 0)
  }, [])

  const closePlayer = useCallback(() => setCurrentIndex(-1), [])
  const next = useCallback(
    () => setCurrentIndex((i) => (i >= 0 && i < queue.length - 1 ? i + 1 : i)),
    [queue.length]
  )
  const prev = useCallback(() => setCurrentIndex((i) => (i > 0 ? i - 1 : i)), [])

  const value = useMemo<PlayerContextValue>(() => {
    const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null
    return {
      currentSong,
      queue,
      currentIndex,
      hasNext: currentIndex >= 0 && currentIndex < queue.length - 1,
      hasPrev: currentIndex > 0,
      playSong,
      closePlayer,
      next,
      prev,
    }
  }, [queue, currentIndex, playSong, closePlayer, next, prev])

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider')
  return ctx
}
