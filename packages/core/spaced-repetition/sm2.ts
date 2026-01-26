/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo 2 algorithm by Piotr Wozniak
 *
 * Quality ratings:
 * 5 - perfect response
 * 4 - correct response after hesitation
 * 3 - correct response with serious difficulty
 * 2 - incorrect response but recalled upon seeing answer
 * 1 - incorrect response, vaguely recalled
 * 0 - complete blackout
 */

export interface ReviewCard {
  videoId: string
  repetitions: number
  easeFactor: number
  interval: number // days
  nextReview: string // ISO date string
  lastReviewed: string // ISO date string
}

interface SM2Input {
  repetitions: number
  easeFactor: number
  interval: number
  quality: number // 0-5
}

interface SM2Result {
  repetitions: number
  easeFactor: number
  interval: number
}

/**
 * Calculate the next review parameters using SM-2 algorithm
 */
export function calculateNextReview(input: SM2Input): SM2Result {
  const { repetitions, easeFactor, interval, quality } = input

  let newRepetitions: number
  let newInterval: number
  let newEaseFactor: number

  // If quality < 3, reset repetitions (wrong answer)
  if (quality < 3) {
    newRepetitions = 0
    newInterval = 1
  } else {
    // Correct answer
    newRepetitions = repetitions + 1

    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval * easeFactor)
    }
  }

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor =
    easeFactor +
    (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // Ease factor should never be less than 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3
  }

  return {
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
    interval: newInterval,
  }
}

/**
 * Get cards that are due for review (overdue or due today)
 * Returns sorted by most overdue first
 */
export function getReviewQueue(cards: ReviewCard[]): ReviewCard[] {
  const now = new Date()
  now.setHours(23, 59, 59, 999) // Include all of today

  return cards
    .filter((card) => {
      const nextReview = new Date(card.nextReview)
      return nextReview <= now
    })
    .sort((a, b) => {
      // Most overdue first
      return (
        new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime()
      )
    })
}

/**
 * Create a new review card for a video
 */
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

/**
 * Update a review card after a study session
 */
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
