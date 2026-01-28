import Link from 'next/link'
import Image from 'next/image'
import fs from 'fs'
import path from 'path'
import { BookOpen, Target, Shuffle, Zap } from 'lucide-react'
import { Button, Card, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { YearGrid } from '@/components/features/YearGrid'
import type { YearReadiness, ReadinessStatus } from '@/components/features/YearGrid'
import summaryData from '../../packages/data/generated/summary.json'

function computeReadiness(years: number[]): YearReadiness[] {
  return years.map((year) => {
    const filePath = path.join(
      process.cwd(),
      'packages/data/generated',
      `year-${year}.json`
    )

    if (!fs.existsSync(filePath)) {
      return { year, status: 'missing' as ReadinessStatus, videoCount: 0, withQuestions: 0, withAnswers: 0 }
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const videos: any[] = data.videos || []
    const videoCount = videos.length
    const withQuestions = videos.filter((v: any) => v.question !== null).length
    const withAnswers = videos.filter(
      (v: any) => v.question !== null && v.question.correctAnswer !== null
    ).length

    let status: ReadinessStatus
    if (videoCount === 0) {
      status = 'missing'
    } else if (withQuestions === 0) {
      status = 'no-questions'
    } else if (withAnswers === videoCount) {
      status = 'ready'
    } else if (withAnswers === 0 && withQuestions < videoCount) {
      // Some videos have no questions, none have answers
      status = 'partial'
    } else if (withAnswers === 0) {
      status = 'no-answers'
    } else {
      // Some have answers, some don't
      status = 'partial'
    }

    return { year, status, videoCount, withQuestions, withAnswers }
  })
}

const learningModes = [
  {
    id: 'sprint',
    title: '考前衝刺',
    description: '從最新年度開始，掌握最新題型',
    icon: Target,
    href: '/learn/115',
    recommended: true,
  },
  {
    id: 'sequential',
    title: '完整複習',
    description: '依年度順序，建立完整單字庫',
    icon: BookOpen,
    href: `/learn/${Math.min(...summaryData.meta.years)}`,
  },
  {
    id: 'random',
    title: '隨機挑戰',
    description: '打亂順序，測試真實實力',
    icon: Shuffle,
    href: '/learn/random',
  },
  {
    id: 'review',
    title: '弱點加強',
    description: '針對答錯的題目重複練習',
    icon: Zap,
    href: '/review',
  },
]

export default function HomePage() {
  const { meta, playlists } = summaryData as typeof summaryData
  const readiness = computeReadiness(meta.years)

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      {/* Hero Section */}
      <section className="px-4 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Image
              src="/images/jutor-logo.png"
              alt="Jutor"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              Jutor
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            學測英文・沈浸式練習
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400 sm:text-lg">
            看影片、學單字、練文意選填，一站搞定歷屆題目
          </p>
          <div className="mt-5 flex justify-center gap-3 text-sm text-zinc-400 dark:text-zinc-500">
            <span>{meta.totalVideos} 部影片</span>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span>{meta.totalYears} 個年度</span>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <span>{meta.years[meta.years.length - 1]}–{meta.years[0]} 學年度</span>
          </div>
        </div>
      </section>

      {/* Learning Modes */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">
            選擇學習路徑
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {learningModes.map((mode) => {
              const Icon = mode.icon
              return (
                <Link key={mode.id} href={mode.href}>
                  <Card className="relative h-full cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
                    {mode.recommended && (
                      <span className="absolute -top-2 right-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
                        推薦
                      </span>
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{mode.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {mode.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Year List */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-white">
            按學年度瀏覽
          </h2>
          <YearGrid
            years={meta.years}
            playlists={playlists.map((p) => ({ year: p.year, videoCount: p.videoCount }))}
            readiness={readiness}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          資料來源：<a href="https://www.youtube.com/@dwhsvideo" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-300">臺南市立大灣高中影音教學頻道</a>
        </p>
      </footer>
    </div>
  )
}
