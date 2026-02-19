import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSummary } from '@/data/questionBank'

const summaryData = getSummary()

export function RandomPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const years = summaryData.meta.years
    const year = years[Math.floor(Math.random() * years.length)]
    const playlist = summaryData.playlists.find((p) => p.year === year)
    const maxIndex = playlist?.videoCount ?? 10
    const index = Math.floor(Math.random() * maxIndex) + 1
    navigate(`/learn/${year}/${index}`, { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-zinc-500">隨機選題中...</p>
    </div>
  )
}
