'use client'

import { useEffect, useRef, useState } from 'react'

interface YouTubePlayerProps {
  videoId: string
  onProgress?: (percent: number) => void
  onComplete?: () => void
}

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function YouTubePlayer({
  videoId,
  onProgress,
  onComplete,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true)
      }
    } else {
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!isReady || !containerRef.current) return

    // Create player
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onStateChange: (event: any) => {
          // Track progress when playing
          if (event.data === window.YT.PlayerState.PLAYING) {
            const interval = setInterval(() => {
              if (playerRef.current) {
                const current = playerRef.current.getCurrentTime()
                const duration = playerRef.current.getDuration()
                const percent = (current / duration) * 100

                onProgress?.(percent)

                // Mark as complete at 80%
                if (percent >= 80) {
                  onComplete?.()
                  clearInterval(interval)
                }
              }
            }, 1000)
          }
        },
      },
    })

    return () => {
      playerRef.current?.destroy()
    }
  }, [isReady, videoId, onProgress, onComplete])

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
