import { useSyncExternalStore, useCallback } from 'react'

export interface VideoProgress {
  videoId: string
  completed: boolean
  watchedAt?: string
  answerSelected?: string
  isCorrect?: boolean
}

export interface DailyActivity {
  date: string
  videosWatched: number
  correctAnswers: number
}

interface ProgressData {
  state: {
    videoProgress: Record<string, VideoProgress>
    dailyGoal: number
    activities: DailyActivity[]
    favorites: string[]
    settings: {
      darkMode: boolean
      playbackSpeed: number
    }
  }
  version: number
}

const STORAGE_KEY = 'learn-gasat-progress'

const defaultState: ProgressData['state'] = {
  videoProgress: {},
  dailyGoal: 10,
  activities: [],
  favorites: [],
  settings: {
    darkMode: false,
    playbackSpeed: 1,
  },
}

function getStoredData(): ProgressData['state'] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return parsed.state ?? defaultState
  } catch {
    return defaultState
  }
}

function setStoredData(state: ProgressData['state']) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, version: 0 }))
  } catch {
    // localStorage may be full or unavailable (private mode)
  }
}

// External store for useSyncExternalStore
let currentState = getStoredData()
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return currentState
}

function updateState(updater: (prev: ProgressData['state']) => ProgressData['state']) {
  currentState = updater(currentState)
  setStoredData(currentState)
  emitChange()
}

function getTodayDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot)

  const markVideoWatched = useCallback((videoId: string) => {
    const today = getTodayDateString()

    updateState((prev) => {
      const alreadyCompleted = prev.videoProgress[videoId]?.completed
      const newProgress = {
        ...prev.videoProgress,
        [videoId]: {
          ...prev.videoProgress[videoId],
          videoId,
          completed: true,
          watchedAt: new Date().toISOString(),
        },
      }

      // Only increment daily count if not already completed
      if (alreadyCompleted) {
        return { ...prev, videoProgress: newProgress }
      }

      const activities = [...prev.activities]
      const idx = activities.findIndex((a) => a.date === today)

      if (idx >= 0) {
        activities[idx] = {
          ...activities[idx],
          videosWatched: activities[idx].videosWatched + 1,
        }
      } else {
        activities.push({ date: today, videosWatched: 1, correctAnswers: 0 })
      }

      return { ...prev, videoProgress: newProgress, activities }
    })
  }, [])

  const recordAnswer = useCallback((videoId: string, answer: string, isCorrect: boolean) => {
    const today = getTodayDateString()

    updateState((prev) => {
      const newProgress = {
        ...prev.videoProgress,
        [videoId]: {
          ...prev.videoProgress[videoId],
          videoId,
          answerSelected: answer,
          isCorrect,
        },
      }

      if (isCorrect) {
        const activities = [...prev.activities]
        const idx = activities.findIndex((a) => a.date === today)
        if (idx >= 0) {
          activities[idx] = {
            ...activities[idx],
            correctAnswers: activities[idx].correctAnswers + 1,
          }
        } else {
          activities.push({ date: today, videosWatched: 0, correctAnswers: 1 })
        }
        return { ...prev, videoProgress: newProgress, activities }
      }

      return { ...prev, videoProgress: newProgress }
    })
  }, [])

  const toggleFavorite = useCallback((videoId: string) => {
    updateState((prev) => {
      const favorites = prev.favorites.includes(videoId)
        ? prev.favorites.filter((id) => id !== videoId)
        : [...prev.favorites, videoId]
      return { ...prev, favorites }
    })
  }, [])

  const getStreak = useCallback(() => {
    const { activities } = state
    if (activities.length === 0) return 0

    const sorted = [...activities].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const latestDate = new Date(sorted[0].date)
    latestDate.setHours(0, 0, 0, 0)

    const diffFromToday = Math.round(
      (today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffFromToday > 1) return 0

    let streak = 0
    const startDate = new Date(latestDate)

    for (let i = 0; i < sorted.length; i++) {
      const activityDate = new Date(sorted[i].date)
      activityDate.setHours(0, 0, 0, 0)

      const expectedDate = new Date(startDate)
      expectedDate.setDate(expectedDate.getDate() - i)

      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }, [state])

  return {
    videoProgress: state.videoProgress,
    favorites: state.favorites,
    settings: state.settings,
    dailyGoal: state.dailyGoal,
    activities: state.activities,
    markVideoWatched,
    recordAnswer,
    toggleFavorite,
    getStreak,
    getCompletedCount: () =>
      Object.values(state.videoProgress).filter((p) => p.completed).length,
  }
}

// Static accessor for non-hook usage (like in ReviewPage's findWrongAnswers)
export function getProgressState() {
  return getStoredData()
}
