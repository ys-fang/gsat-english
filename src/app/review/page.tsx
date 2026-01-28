'use client'

import Link from 'next/link'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { useProgressStore } from '@/lib/stores/progress-store'
import summaryData from '../../../packages/data/generated/summary.json'

interface WrongAnswer {
  videoId: string
  year: number
  index: number
  answerSelected: string
}

function findWrongAnswers(): WrongAnswer[] {
  const progress = useProgressStore.getState().videoProgress
  const wrong: WrongAnswer[] = []

  for (const playlist of summaryData.playlists) {
    for (let i = 1; i <= playlist.videoCount; i++) {
      const videoId = `${playlist.year}-${i}`
      const p = progress[videoId]
      if (p && p.isCorrect === false) {
        wrong.push({
          videoId,
          year: playlist.year,
          index: i,
          answerSelected: p.answerSelected ?? '',
        })
      }
    }
  }

  return wrong.sort((a, b) => b.year - a.year || a.index - b.index)
}

export default function ReviewPage() {
  const videoProgress = useProgressStore((s) => s.videoProgress)
  const wrongAnswers = findWrongAnswers()

  const totalAnswered = Object.values(videoProgress).filter(
    (p) => p.isCorrect !== undefined
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回首頁
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          弱點加強
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          針對答錯的題目重複練習
        </p>

        {totalAnswered === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">
                尚未作答任何題目
              </p>
              <Link href={`/learn/${Math.max(...summaryData.meta.years)}`}>
                <Button className="mt-4">開始練習</Button>
              </Link>
            </CardContent>
          </Card>
        ) : wrongAnswers.length === 0 ? (
          <Card className="mt-8">
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-zinc-900 dark:text-white">
                全部答對！
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                目前沒有答錯的題目，繼續保持！
              </p>
              <Link href="/learn/random">
                <Button className="mt-4">隨機挑戰</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              共 {wrongAnswers.length} 題答錯
            </p>
            <div className="mt-6 space-y-3">
              {wrongAnswers.map((item) => (
                <Link
                  key={item.videoId}
                  href={`/learn/${item.year}/${item.index}`}
                >
                  <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {item.year} 學年度 第 {item.index} 題
                        </p>
                        <p className="mt-0.5 text-xs text-red-500">
                          上次選擇：({item.answerSelected})
                        </p>
                      </div>
                      <RotateCcw className="h-4 w-4 text-zinc-400" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
