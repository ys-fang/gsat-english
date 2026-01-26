import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import { LearningView } from './LearningView'
import summaryData from '../../../../../packages/data/generated/summary.json'

interface PageProps {
  params: Promise<{ year: string; index: string }>
}

export function generateStaticParams() {
  const params: { year: string; index: string }[] = []
  const seen = new Set<string>()
  for (const year of summaryData.meta.years) {
    const filePath = path.join(
      process.cwd(),
      'packages/data/generated',
      `year-${year}.json`
    )
    if (!fs.existsSync(filePath)) continue
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    for (let i = 1; i <= data.videos.length; i++) {
      const key = `${year}-${i}`
      if (!seen.has(key)) {
        seen.add(key)
        params.push({ year: String(year), index: String(i) })
      }
    }
  }
  return params
}

async function getVideoData(year: number, index: number) {
  const filePath = path.join(
    process.cwd(),
    'packages/data/generated',
    `year-${year}.json`
  )

  if (!fs.existsSync(filePath)) {
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const data = JSON.parse(content)
  const videos = data.videos

  // Use array position (1-based index)
  const video = videos[index - 1]
  if (!video) {
    return null
  }

  return {
    video,
    totalVideos: videos.length,
    currentIndex: index,
    year,
    prevIndex: index > 1 ? index - 1 : null,
    nextIndex: index < videos.length ? index + 1 : null,
  }
}

export default async function LearnPage({ params }: PageProps) {
  const { year: yearStr, index: indexStr } = await params
  const year = parseInt(yearStr)
  const index = parseInt(indexStr)

  if (isNaN(year) || isNaN(index)) {
    notFound()
  }

  const data = await getVideoData(year, index)

  if (!data) {
    notFound()
  }

  return <LearningView {...data} />
}
