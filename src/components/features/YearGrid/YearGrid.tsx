'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'

export type ReadinessStatus =
  | 'ready'         // 完整可用: all videos have questions + correctAnswer
  | 'no-answers'    // 有題缺答案: questions exist but no correctAnswer
  | 'partial'       // 部分完整: mix of question states
  | 'no-questions'  // 僅有影片: no questions at all
  | 'missing'       // 無資料: year data file not found

export interface YearReadiness {
  year: number
  status: ReadinessStatus
  videoCount: number
  withQuestions: number
  withAnswers: number
}

const statusConfig: Record<ReadinessStatus, { label: string; color: string }> = {
  ready:        { label: '完整可用',   color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  'no-answers': { label: '有題缺答案', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' },
  partial:      { label: '部分完整',   color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  'no-questions': { label: '僅有影片', color: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300' },
  missing:      { label: '無資料',     color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

interface YearGridProps {
  years: number[]
  playlists: { year: number; videoCount: number }[]
  readiness: YearReadiness[]
}

export function YearGrid({ years, playlists, readiness }: YearGridProps) {
  const [showTags, setShowTags] = useState(false)

  useEffect(() => {
    const win = window as any
    win.showTags = () => {
      setShowTags(true)
      console.log(
        '%c[LearnGASAT] Readiness tags enabled',
        'color: #22c55e; font-weight: bold'
      )
      // Print summary table
      console.table(
        readiness.map((r) => ({
          年份: r.year,
          狀態: statusConfig[r.status].label,
          影片數: r.videoCount,
          有題目: r.withQuestions,
          有答案: r.withAnswers,
        }))
      )
    }
    win.hideTags = () => {
      setShowTags(false)
      console.log(
        '%c[LearnGASAT] Readiness tags hidden',
        'color: #ef4444; font-weight: bold'
      )
    }
    return () => {
      delete win.showTags
      delete win.hideTags
    }
  }, [readiness])

  const readinessMap = new Map(readiness.map((r) => [r.year, r]))

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {years.map((year) => {
        const playlist = playlists.find((p) => p.year === year)
        const yearReadiness = readinessMap.get(year)
        const status = yearReadiness?.status ?? 'missing'
        const config = statusConfig[status]

        return (
          <Link key={year} href={`/learn/${year}`}>
            <Button
              variant="outline"
              className="w-full flex-col h-auto py-3 gap-0.5 relative"
            >
              <span className="text-lg font-semibold">{year}</span>
              <span className="text-xs text-zinc-500">
                {playlist?.videoCount || 0} 題
              </span>
              {showTags && (
                <span
                  className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-tight ${config.color}`}
                >
                  {config.label}
                </span>
              )}
            </Button>
          </Link>
        )
      })}
    </div>
  )
}
