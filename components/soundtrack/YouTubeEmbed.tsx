'use client'

import { useEffect, useRef, useCallback } from 'react'

interface YouTubeEmbedProps {
  videoId: string
  title: string
  onEnded?: () => void
}

// Load YouTube IFrame API script once globally
let apiReady = false
let apiCallbacks: (() => void)[] = []

function ensureYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (apiReady && window.YT?.Player) {
      resolve()
      return
    }

    apiCallbacks.push(resolve)

    // Only inject script once
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script')
      tag.id = 'yt-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)

      // YouTube calls this global function when API is ready
      ;(window as any).onYouTubeIframeAPIReady = () => {
        apiReady = true
        apiCallbacks.forEach((cb) => cb())
        apiCallbacks = []
      }
    }
  })
}

export function YouTubeEmbed({ videoId, title, onEnded }: YouTubeEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const onEndedRef = useRef(onEnded)

  // Keep callback ref fresh
  onEndedRef.current = onEnded

  const initPlayer = useCallback(async () => {
    await ensureYTApi()

    // Destroy old player if it exists
    if (playerRef.current) {
      try { playerRef.current.destroy() } catch { /* silent */ }
      playerRef.current = null
    }

    if (!containerRef.current) return

    // Create a new div for the player (YT API replaces the element)
    const el = document.createElement('div')
    el.id = `yt-player-${videoId}`
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(el)

    playerRef.current = new window.YT.Player(el.id, {
      videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onStateChange: (event: any) => {
          // YT.PlayerState.ENDED === 0
          if (event.data === 0) {
            onEndedRef.current?.()
          }
        },
      },
    })
  }, [videoId])

  useEffect(() => {
    initPlayer()

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy() } catch { /* silent */ }
        playerRef.current = null
      }
    }
  }, [initPlayer])

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full [&>div]:w-full [&>div]:h-full [&>iframe]:w-full [&>iframe]:h-full" />
    </div>
  )
}

// Extend Window type for YouTube API
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: any
      ) => any
      PlayerState: {
        ENDED: number
        PLAYING: number
        PAUSED: number
        BUFFERING: number
        CUED: number
      }
    }
  }
}
