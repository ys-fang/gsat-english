'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VideoProgress {
  videoId: string
  completed: boolean
  watchedAt?: string
  answerSelected?: string
  isCorrect?: boolean
}

export interface DailyActivity {
  date: string // YYYY-MM-DD
  videosWatched: number
  correctAnswers: number
}

interface ProgressState {
  // Video progress
  videoProgress: Record<string, VideoProgress>

  // Daily goals
  dailyGoal: number

  // Activities
  activities: DailyActivity[]

  // Favorites
  favorites: string[]

  // Settings
  settings: {
    darkMode: boolean
    playbackSpeed: number
  }

  // Actions
  markVideoWatched: (videoId: string) => void
  recordAnswer: (videoId: string, answer: string, isCorrect: boolean) => void
  toggleFavorite: (videoId: string) => void
  setDailyGoal: (goal: number) => void
  updateSettings: (settings: Partial<ProgressState['settings']>) => void

  // Computed getters
  getStreak: () => number
  getTodayProgress: () => { completed: number; goal: number }
  getCompletedCount: () => number
}

const getTodayDateString = () => new Date().toISOString().split('T')[0]

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      videoProgress: {},
      dailyGoal: 10,
      activities: [],
      favorites: [],
      settings: {
        darkMode: false,
        playbackSpeed: 1,
      },

      markVideoWatched: (videoId) => {
        const today = getTodayDateString()

        set((state) => {
          // Update video progress
          const newProgress = {
            ...state.videoProgress,
            [videoId]: {
              ...state.videoProgress[videoId],
              videoId,
              completed: true,
              watchedAt: new Date().toISOString(),
            },
          }

          // Update daily activity
          const existingActivityIndex = state.activities.findIndex(
            (a) => a.date === today
          )
          const activities = [...state.activities]

          if (existingActivityIndex >= 0) {
            activities[existingActivityIndex] = {
              ...activities[existingActivityIndex],
              videosWatched: activities[existingActivityIndex].videosWatched + 1,
            }
          } else {
            activities.push({
              date: today,
              videosWatched: 1,
              correctAnswers: 0,
            })
          }

          return {
            videoProgress: newProgress,
            activities,
          }
        })
      },

      recordAnswer: (videoId, answer, isCorrect) => {
        const today = getTodayDateString()

        set((state) => {
          const newProgress = {
            ...state.videoProgress,
            [videoId]: {
              ...state.videoProgress[videoId],
              videoId,
              answerSelected: answer,
              isCorrect,
            },
          }

          // Update correct answers count if correct
          if (isCorrect) {
            const existingActivityIndex = state.activities.findIndex(
              (a) => a.date === today
            )
            const activities = [...state.activities]

            if (existingActivityIndex >= 0) {
              activities[existingActivityIndex] = {
                ...activities[existingActivityIndex],
                correctAnswers: activities[existingActivityIndex].correctAnswers + 1,
              }
            }

            return { videoProgress: newProgress, activities }
          }

          return { videoProgress: newProgress }
        })
      },

      toggleFavorite: (videoId) => {
        set((state) => {
          const favorites = state.favorites.includes(videoId)
            ? state.favorites.filter((id) => id !== videoId)
            : [...state.favorites, videoId]
          return { favorites }
        })
      },

      setDailyGoal: (goal) => {
        set({ dailyGoal: goal })
      },

      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },

      getStreak: () => {
        const { activities } = get()
        if (activities.length === 0) return 0

        // Sort by date descending
        const sorted = [...activities].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let i = 0; i < sorted.length; i++) {
          const activityDate = new Date(sorted[i].date)
          activityDate.setHours(0, 0, 0, 0)

          const expectedDate = new Date(today)
          expectedDate.setDate(expectedDate.getDate() - i)

          if (activityDate.getTime() === expectedDate.getTime()) {
            streak++
          } else if (i === 0) {
            // If today has no activity, check if yesterday had activity
            expectedDate.setDate(expectedDate.getDate() - 1)
            if (activityDate.getTime() === expectedDate.getTime()) {
              streak++
            } else {
              break
            }
          } else {
            break
          }
        }

        return streak
      },

      getTodayProgress: () => {
        const { activities, dailyGoal } = get()
        const today = getTodayDateString()
        const todayActivity = activities.find((a) => a.date === today)

        return {
          completed: todayActivity?.videosWatched || 0,
          goal: dailyGoal,
        }
      },

      getCompletedCount: () => {
        const { videoProgress } = get()
        return Object.values(videoProgress).filter((p) => p.completed).length
      },
    }),
    {
      name: 'learn-gasat-progress',
    }
  )
)
