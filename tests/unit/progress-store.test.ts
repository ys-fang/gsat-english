import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock zustand persist before importing the store
vi.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}))

// Need to reset the store state between tests
import { useProgressStore } from '../../src/lib/stores/progress-store'

describe('ProgressStore', () => {
  beforeEach(() => {
    // Reset store state
    useProgressStore.setState({
      videoProgress: {},
      dailyGoal: 10,
      activities: [],
      favorites: [],
      settings: {
        darkMode: false,
        playbackSpeed: 1,
      },
    })
  })

  describe('markVideoWatched', () => {
    it('should mark a video as watched', () => {
      const { markVideoWatched, videoProgress } = useProgressStore.getState()

      markVideoWatched('video123')

      const updatedProgress = useProgressStore.getState().videoProgress
      expect(updatedProgress['video123']).toBeDefined()
      expect(updatedProgress['video123'].completed).toBe(true)
      expect(updatedProgress['video123'].watchedAt).toBeDefined()
    })

    it('should update daily activity when marking video as watched', () => {
      const { markVideoWatched } = useProgressStore.getState()

      markVideoWatched('video123')
      markVideoWatched('video456')

      const { activities } = useProgressStore.getState()
      expect(activities.length).toBe(1)
      expect(activities[0].videosWatched).toBe(2)
    })
  })

  describe('recordAnswer', () => {
    it('should record an answer for a video', () => {
      const { recordAnswer } = useProgressStore.getState()

      recordAnswer('video123', 'B', true)

      const { videoProgress } = useProgressStore.getState()
      expect(videoProgress['video123'].answerSelected).toBe('B')
      expect(videoProgress['video123'].isCorrect).toBe(true)
    })

    it('should update correct answers count when answer is correct', () => {
      const { markVideoWatched, recordAnswer } = useProgressStore.getState()

      // First mark as watched to create activity
      markVideoWatched('video123')
      recordAnswer('video123', 'B', true)

      const { activities } = useProgressStore.getState()
      expect(activities[0].correctAnswers).toBe(1)
    })
  })

  describe('toggleFavorite', () => {
    it('should add video to favorites', () => {
      const { toggleFavorite } = useProgressStore.getState()

      toggleFavorite('video123')

      const { favorites } = useProgressStore.getState()
      expect(favorites).toContain('video123')
    })

    it('should remove video from favorites if already favorited', () => {
      const { toggleFavorite } = useProgressStore.getState()

      toggleFavorite('video123')
      toggleFavorite('video123')

      const { favorites } = useProgressStore.getState()
      expect(favorites).not.toContain('video123')
    })
  })

  describe('getStreak', () => {
    it('should return 0 when no activities', () => {
      const { getStreak } = useProgressStore.getState()
      expect(getStreak()).toBe(0)
    })

    it('should calculate correct streak for consecutive days', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      useProgressStore.setState({
        activities: [
          {
            date: today.toISOString().split('T')[0],
            videosWatched: 5,
            correctAnswers: 3,
          },
          {
            date: yesterday.toISOString().split('T')[0],
            videosWatched: 3,
            correctAnswers: 2,
          },
          {
            date: twoDaysAgo.toISOString().split('T')[0],
            videosWatched: 7,
            correctAnswers: 5,
          },
        ],
      })

      const { getStreak } = useProgressStore.getState()
      expect(getStreak()).toBe(3)
    })

    it('should break streak when there is a gap', () => {
      const today = new Date()
      const twoDaysAgo = new Date(today)
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      useProgressStore.setState({
        activities: [
          {
            date: today.toISOString().split('T')[0],
            videosWatched: 5,
            correctAnswers: 3,
          },
          // Gap: yesterday missing
          {
            date: twoDaysAgo.toISOString().split('T')[0],
            videosWatched: 7,
            correctAnswers: 5,
          },
        ],
      })

      const { getStreak } = useProgressStore.getState()
      expect(getStreak()).toBe(1)
    })
  })

  describe('getTodayProgress', () => {
    it('should return 0 completed when no activity today', () => {
      const { getTodayProgress } = useProgressStore.getState()
      const progress = getTodayProgress()

      expect(progress.completed).toBe(0)
      expect(progress.goal).toBe(10)
    })

    it('should return correct progress for today', () => {
      const today = new Date().toISOString().split('T')[0]

      useProgressStore.setState({
        activities: [
          {
            date: today,
            videosWatched: 7,
            correctAnswers: 5,
          },
        ],
        dailyGoal: 15,
      })

      const { getTodayProgress } = useProgressStore.getState()
      const progress = getTodayProgress()

      expect(progress.completed).toBe(7)
      expect(progress.goal).toBe(15)
    })
  })

  describe('getCompletedCount', () => {
    it('should return 0 when no videos watched', () => {
      const { getCompletedCount } = useProgressStore.getState()
      expect(getCompletedCount()).toBe(0)
    })

    it('should return correct count of completed videos', () => {
      useProgressStore.setState({
        videoProgress: {
          video1: { videoId: 'video1', completed: true },
          video2: { videoId: 'video2', completed: true },
          video3: { videoId: 'video3', completed: false },
        },
      })

      const { getCompletedCount } = useProgressStore.getState()
      expect(getCompletedCount()).toBe(2)
    })
  })

  describe('setDailyGoal', () => {
    it('should update daily goal', () => {
      const { setDailyGoal } = useProgressStore.getState()

      setDailyGoal(20)

      const { dailyGoal } = useProgressStore.getState()
      expect(dailyGoal).toBe(20)
    })
  })

  describe('updateSettings', () => {
    it('should update settings partially', () => {
      const { updateSettings } = useProgressStore.getState()

      updateSettings({ darkMode: true })

      const { settings } = useProgressStore.getState()
      expect(settings.darkMode).toBe(true)
      expect(settings.playbackSpeed).toBe(1) // unchanged
    })
  })
})
