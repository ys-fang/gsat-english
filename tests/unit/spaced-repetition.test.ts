import { describe, it, expect } from 'vitest'
import {
  calculateNextReview,
  getReviewQueue,
  type ReviewCard,
} from '../../packages/core/spaced-repetition/sm2'

describe('SpacedRepetition (SM-2 Algorithm)', () => {
  describe('calculateNextReview', () => {
    it('should return 1 day interval for first correct answer', () => {
      const result = calculateNextReview({
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        quality: 4, // correct with hesitation
      })

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
    })

    it('should return 6 day interval for second correct answer', () => {
      const result = calculateNextReview({
        repetitions: 1,
        easeFactor: 2.5,
        interval: 1,
        quality: 4,
      })

      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('should multiply interval by ease factor after third repetition', () => {
      const result = calculateNextReview({
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        quality: 4,
      })

      expect(result.interval).toBe(15) // Math.round(6 * 2.5)
      expect(result.repetitions).toBe(3)
    })

    it('should reset on quality < 3 (wrong answer)', () => {
      const result = calculateNextReview({
        repetitions: 5,
        easeFactor: 2.5,
        interval: 30,
        quality: 1,
      })

      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(0)
    })

    it('should decrease ease factor for difficult items', () => {
      const result = calculateNextReview({
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        quality: 3, // correct but barely
      })

      expect(result.easeFactor).toBeLessThan(2.5)
    })

    it('should increase ease factor for easy items', () => {
      const result = calculateNextReview({
        repetitions: 2,
        easeFactor: 2.5,
        interval: 6,
        quality: 5, // perfect
      })

      expect(result.easeFactor).toBeGreaterThan(2.5)
    })

    it('should not let ease factor go below 1.3', () => {
      const result = calculateNextReview({
        repetitions: 2,
        easeFactor: 1.3,
        interval: 6,
        quality: 3,
      })

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
    })
  })

  describe('getReviewQueue', () => {
    it('should return cards due for review', () => {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const cards: ReviewCard[] = [
        {
          videoId: 'video1',
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReview: yesterday.toISOString(),
          lastReviewed: yesterday.toISOString(),
        },
        {
          videoId: 'video2',
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReview: tomorrow.toISOString(),
          lastReviewed: now.toISOString(),
        },
        {
          videoId: 'video3',
          repetitions: 0,
          easeFactor: 2.5,
          interval: 0,
          nextReview: now.toISOString(),
          lastReviewed: now.toISOString(),
        },
      ]

      const queue = getReviewQueue(cards)

      // video1 (yesterday) and video3 (today) should be in queue
      expect(queue.length).toBe(2)
      expect(queue.map((c) => c.videoId)).toContain('video1')
      expect(queue.map((c) => c.videoId)).toContain('video3')
    })

    it('should return empty array when no cards are due', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const cards: ReviewCard[] = [
        {
          videoId: 'video1',
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReview: tomorrow.toISOString(),
          lastReviewed: new Date().toISOString(),
        },
      ]

      const queue = getReviewQueue(cards)
      expect(queue.length).toBe(0)
    })

    it('should sort queue with most overdue items first', () => {
      const now = new Date()
      const threeDaysAgo = new Date(now)
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const oneDayAgo = new Date(now)
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const cards: ReviewCard[] = [
        {
          videoId: 'recent',
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReview: oneDayAgo.toISOString(),
          lastReviewed: oneDayAgo.toISOString(),
        },
        {
          videoId: 'overdue',
          repetitions: 1,
          easeFactor: 2.5,
          interval: 1,
          nextReview: threeDaysAgo.toISOString(),
          lastReviewed: threeDaysAgo.toISOString(),
        },
      ]

      const queue = getReviewQueue(cards)
      expect(queue[0].videoId).toBe('overdue')
    })
  })
})
