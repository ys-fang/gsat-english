'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import summaryData from '../../../../packages/data/generated/summary.json'

export default function RandomPage() {
  const router = useRouter()

  useEffect(() => {
    const years = summaryData.meta.years
    const year = years[Math.floor(Math.random() * years.length)]
    const playlist = summaryData.playlists.find((p) => p.year === year)
    const maxIndex = playlist?.videoCount ?? 10
    const index = Math.floor(Math.random() * maxIndex) + 1
    router.replace(`/learn/${year}/${index}`)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-500">隨機選題中...</p>
    </div>
  )
}
