/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak
 */

export interface ReviewCard {
  videoId: string
  repetitions: number
  easeFactor: number
  interval: number
  nextReview: string
  lastReviewed: string
}

interface SM2Input {
  repetitions: number
  easeFactor: number
  interval: number
  quality: number
}

interface SM2Result {
  repetitions: number
  easeFactor: number
  interval: number
}

export function calculateNextReview(input: SM2Input): SM2Result {
  const { repetitions, easeFactor, interval, quality } = input

  let newRepetitions: number
  let newInterval: number
  let newEaseFactor: number

  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    newRepetitions = repetitions + 1

    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * easeFactor)
    }
  }

  newEaseFactor =
    easeFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3
  }

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
  }
}

export function getReviewQueue(cards: ReviewCard[]): ReviewCard[] {
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  return cards
    .filter((card) => {
      const nextReview = new Date(card.nextReview)
      return nextReview <= now
    })
    .sort((a, b) => {
      return (
        new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
      )
    })
}

export function createReviewCard(videoId: string): ReviewCard {
  const now = new Date().toISOString()
  return {
    videoId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReview: now,
    lastReviewed: now,
  }
}

export function updateReviewCard(
  card: ReviewCard,
  quality: number
): ReviewCard {
  const result = calculateNextReview({
    repetitions: card.repetitions,
    easeFactor: card.easeFactor,
    interval: card.interval,
    quality,
  })

  const now = new Date()
  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + result.interval)

  return {
    ...card,
    repetitions: result.repetitions,
    easeFactor: result.easeFactor,
    interval: result.interval,
    nextReview: nextReview.toISOString(),
    lastReviewed: now.toISOString(),
  }
}
