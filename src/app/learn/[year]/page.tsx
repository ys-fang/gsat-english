import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Play, Clock, Eye } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import summaryData from '../../../../packages/data/generated/summary.json'
import fs from 'fs'
import path from 'path'

interface PageProps {
  params: Promise<{ year: string }>
}

async function getYearData(year: number) {
  const filePath = path.join(
    process.cwd(),
    'packages/data/generated',
    `year-${year}.json`
  )

  if (!fs.existsSync(filePath)) {
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(content)
}

export default async function YearPage({ params }: PageProps) {
  const { year: yearStr } = await params
  const year = parseInt(yearStr)

  if (isNaN(year) || !summaryData.meta.years.includes(year)) {
    notFound()
  }

  const yearData = await getYearData(year)

  if (!yearData) {
    notFound()
  }

  const videos = yearData.videos

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {year} 學年度
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              英文文意字彙 ・ {videos.length} 題
            </p>
          </div>
        </div>
      </header>

      {/* Video List */}
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-3">
          {videos.map((video: any, index: number) => (
            <Link key={video.youtubeId} href={`/learn/${year}/${index + 1}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
                <CardContent className="flex items-start gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-32 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.videoTitle}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                      {video.duration}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        第 {video.videoIndex} 題
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {video.question?.questionText || video.videoTitle}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
