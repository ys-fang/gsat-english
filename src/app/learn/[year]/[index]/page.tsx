import { notFound } from 'next/navigation'
import fs from 'fs'
import path from 'path'
import { LearningView } from './LearningView'

interface PageProps {
  params: Promise<{ year: string; index: string }>
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

  // Find video by index (1-based)
  const video = videos.find((v: any) => v.videoIndex === index)
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
