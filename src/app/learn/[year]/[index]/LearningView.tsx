'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Star,
  Timer,
} from 'lucide-react'
import { Button, Progress } from '@/components/ui'
import { QuestionCard } from '@/components/features/QuestionCard'
import { useProgressStore } from '@/lib/stores/progress-store'
import { cn } from '@/lib/utils'

interface VideoData {
  youtubeId: string
  videoTitle: string
  description: string
  duration: string
  durationSeconds: number
  question: {
    questionText: string
    options: {
      A: string
      B: string
      C: string
      D: string
    }
    correctAnswer: string | null
  } | null
}

interface LearningViewProps {
  video: VideoData
  totalVideos: number
  currentIndex: number
  year: number
  prevIndex: number | null
  nextIndex: number | null
}

export function LearningView({
  video,
  totalVideos,
  currentIndex,
  year,
  prevIndex,
  nextIndex,
}: LearningViewProps) {
  const router = useRouter()
  const [isImmersive, setIsImmersive] = useState(false)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes
  const [isPomodoroActive, setIsPomodoroActive] = useState(false)
  const [showQuestion, setShowQuestion] = useState(true)

  const {
    markVideoWatched,
    recordAnswer,
    toggleFavorite,
    favorites,
    videoProgress,
  } = useProgressStore()

  const isFavorite = favorites.includes(video.youtubeId)
  const progress = videoProgress[video.youtubeId]

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && prevIndex) {
        router.push(`/learn/${year}/${prevIndex}`)
      } else if (e.key === 'ArrowRight' && nextIndex) {
        router.push(`/learn/${year}/${nextIndex}`)
      } else if (e.key === 'Escape' && isImmersive) {
        setIsImmersive(false)
        document.exitFullscreen?.()
      } else if (e.key === 'f') {
        toggleImmersive()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevIndex, nextIndex, year, router, isImmersive])

  // Pomodoro timer
  useEffect(() => {
    if (!isPomodoroActive || pomodoroTime <= 0) return

    const interval = setInterval(() => {
      setPomodoroTime((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isPomodoroActive, pomodoroTime])

  const toggleImmersive = async () => {
    if (!isImmersive) {
      await document.documentElement.requestFullscreen?.()
      setIsImmersive(true)
    } else {
      await document.exitFullscreen?.()
      setIsImmersive(false)
    }
  }

  const handleAnswer = (answer: string, isCorrect: boolean) => {
    recordAnswer(video.youtubeId, answer, isCorrect)
    markVideoWatched(video.youtubeId)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        isImmersive
          ? 'bg-zinc-950'
          : 'bg-zinc-50 dark:bg-zinc-950'
      )}
    >
      {/* Header */}
      <header
        className={cn(
          'sticky top-0 z-10 border-b transition-all duration-300',
          isImmersive
            ? 'border-zinc-800 bg-zinc-900/95 backdrop-blur-sm'
            : 'border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80'
        )}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/learn/${year}`}>
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className={cn(
                'text-sm font-medium',
                isImmersive ? 'text-white' : 'text-zinc-900 dark:text-white'
              )}>
                {year} 學年度 ・ 第 {currentIndex} 題
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pomodoro Timer */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'gap-1.5 font-mono text-sm',
                isPomodoroActive && 'text-red-500'
              )}
              onClick={() => setIsPomodoroActive(!isPomodoroActive)}
            >
              <Timer className="h-4 w-4" />
              {formatTime(pomodoroTime)}
            </Button>

            {/* Favorite */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => toggleFavorite(video.youtubeId)}
            >
              <Star
                className={cn(
                  'h-5 w-5 transition-colors',
                  isFavorite
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-zinc-400'
                )}
              />
            </Button>

            {/* Immersive Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={toggleImmersive}
            >
              {isImmersive ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress
          value={(currentIndex / totalVideos) * 100}
          className="h-1 rounded-none"
        />
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Video Player */}
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
            title={video.videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>

        {/* Question Section */}
        {video.question && (
          <div className="mt-6">
            <button
              onClick={() => setShowQuestion(!showQuestion)}
              className={cn(
                'mb-4 flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors',
                isImmersive
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                  : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700'
              )}
            >
              <span className="font-medium">練習題目</span>
              <ChevronRight
                className={cn(
                  'h-5 w-5 transition-transform',
                  showQuestion && 'rotate-90'
                )}
              />
            </button>

            {showQuestion && (
              <QuestionCard
                question={video.question}
                onAnswer={handleAnswer}
                disabled={!!progress?.answerSelected}
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {prevIndex ? (
            <Link href={`/learn/${year}/${prevIndex}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                上一題
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <span className={cn(
            'text-sm',
            isImmersive ? 'text-zinc-400' : 'text-zinc-500'
          )}>
            {currentIndex} / {totalVideos}
          </span>

          {nextIndex ? (
            <Link href={`/learn/${year}/${nextIndex}`}>
              <Button variant="primary" className="gap-2">
                下一題
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href={`/learn/${year}`}>
              <Button variant="primary" className="gap-2">
                完成
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Keyboard Hints */}
        <div className={cn(
          'mt-8 text-center text-xs',
          isImmersive ? 'text-zinc-500' : 'text-zinc-400'
        )}>
          <kbd className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-700">←</kbd> 上一題
          {' ・ '}
          <kbd className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-700">→</kbd> 下一題
          {' ・ '}
          <kbd className="rounded bg-zinc-200 px-1.5 py-0.5 dark:bg-zinc-700">F</kbd> 全螢幕
        </div>
      </main>
    </div>
  )
}
