import summaryData from './summary.json'

export interface VideoData {
  playlistId: string
  playlistTitle: string
  videoIndex: number
  youtubeId: string
  videoTitle: string
  description: string
  duration: string
  durationSeconds: number
  createdAt: string
  views: number
  youtubeLink: string
  year: number
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

export interface YearData {
  year: number
  playlist: {
    playlistId: string
    playlistTitle: string
  }
  videos: VideoData[]
}

// Import all year data files statically
const yearModules = import.meta.glob<{ default: YearData }>('./year-*.json', { eager: true })

const yearDataCache = new Map<number, YearData>()

// Populate cache from eagerly-loaded modules
for (const [path, mod] of Object.entries(yearModules)) {
  const match = path.match(/year-(\d+)\.json$/)
  if (match) {
    const year = parseInt(match[1])
    yearDataCache.set(year, mod.default ?? (mod as unknown as YearData))
  }
}

export function getYearData(year: number): YearData | null {
  return yearDataCache.get(year) ?? null
}

export function getSummary() {
  return summaryData
}

export type ReadinessStatus =
  | 'ready'
  | 'no-answers'
  | 'partial'
  | 'no-questions'
  | 'missing'

export interface YearReadiness {
  year: number
  status: ReadinessStatus
  videoCount: number
  withQuestions: number
  withAnswers: number
}

export function computeReadiness(years: number[]): YearReadiness[] {
  return years.map((year) => {
    const data = getYearData(year)

    if (!data) {
      return { year, status: 'missing' as ReadinessStatus, videoCount: 0, withQuestions: 0, withAnswers: 0 }
    }

    const videos = data.videos || []
    const videoCount = videos.length
    const withQuestions = videos.filter((v) => v.question !== null).length
    const withAnswers = videos.filter(
      (v) => v.question !== null && v.question.correctAnswer !== null
    ).length

    let status: ReadinessStatus
    if (videoCount === 0) {
      status = 'missing'
    } else if (withQuestions === 0) {
      status = 'no-questions'
    } else if (withAnswers === videoCount) {
      status = 'ready'
    } else if (withAnswers === 0 && withQuestions < videoCount) {
      status = 'partial'
    } else if (withAnswers === 0) {
      status = 'no-answers'
    } else {
      status = 'partial'
    }

    return { year, status, videoCount, withQuestions, withAnswers }
  })
}
