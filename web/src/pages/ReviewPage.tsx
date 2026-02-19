import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { useProgress } from '@/hooks/useProgress'
import { getSummary, getYearData } from '@/data/questionBank'

const summaryData = getSummary()

interface WrongAnswer {
  videoId: string
  year: number
  index: number
  answerSelected: string
}

function findWrongAnswers(videoProgress: Record<string, { isCorrect?: boolean; answerSelected?: string }>): WrongAnswer[] {
  const wrong: WrongAnswer[] = []

  for (const playlist of summaryData.playlists) {
    const yearData = getYearData(playlist.year)
    if (!yearData) continue

    for (let i = 0; i < yearData.videos.length; i++) {
      const video = yearData.videos[i]
      const p = videoProgress[video.youtubeId]
      if (p && p.isCorrect === false) {
        wrong.push({
          videoId: video.youtubeId,
          year: playlist.year,
          index: i + 1,
          answerSelected: p.answerSelected ?? '',
        })
      }
    }
  }

  return wrong.sort((a, b) => b.year - a.year || a.index - b.index)
}

export function ReviewPage() {
  const { videoProgress } = useProgress()
  const wrongAnswers = findWrongAnswers(videoProgress)

  const totalAnswered = Object.values(videoProgress).filter(
    (p) => p.isCorrect !== undefined
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/">
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
              <Link to={`/learn/${Math.max(...summaryData.meta.years)}`}>
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
              <Link to="/learn/random">
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
                  to={`/learn/${item.year}/${item.index}`}
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
