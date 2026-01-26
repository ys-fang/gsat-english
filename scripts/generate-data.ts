/**
 * 資料產生腳本
 * 從 TSV 檔案解析並產生 JSON 資料供應用程式使用
 */

import fs from 'fs'
import path from 'path'
import {
  parseTsvContent,
  groupVideosByYear,
  type VideoData,
} from '../packages/data/parser/video-parser'

const TSV_PATH = path.join(
  __dirname,
  '../../臺南市立大灣高中影音教學頻道_2026-01-25.tsv'
)
const OUTPUT_DIR = path.join(__dirname, '../packages/data/generated')

interface PlaylistSummary {
  id: string
  title: string
  year: number
  videoCount: number
  totalDuration: number
}

interface GeneratedData {
  meta: {
    generatedAt: string
    totalVideos: number
    totalYears: number
    years: number[]
  }
  playlists: PlaylistSummary[]
  videosByYear: Record<number, VideoData[]>
}

async function main() {
  console.log('📂 讀取 TSV 檔案...')

  if (!fs.existsSync(TSV_PATH)) {
    console.error(`❌ 找不到檔案: ${TSV_PATH}`)
    process.exit(1)
  }

  const content = fs.readFileSync(TSV_PATH, 'utf-8')
  console.log(`✅ 檔案讀取完成，共 ${content.split('\n').length} 行`)

  console.log('🔄 解析資料中...')
  const videos = parseTsvContent(content)
  console.log(`✅ 解析完成，共 ${videos.length} 部影片`)

  // 按學年度分組
  const videosByYear = groupVideosByYear(videos)
  const years = Object.keys(videosByYear)
    .map(Number)
    .sort((a, b) => b - a) // 降序排列

  console.log(`📊 學年度範圍: ${years[years.length - 1]} ~ ${years[0]}`)

  // 建立播放清單摘要
  const playlistMap = new Map<string, PlaylistSummary>()
  for (const video of videos) {
    if (!playlistMap.has(video.playlistId)) {
      playlistMap.set(video.playlistId, {
        id: video.playlistId,
        title: video.playlistTitle,
        year: video.year,
        videoCount: 0,
        totalDuration: 0,
      })
    }
    const playlist = playlistMap.get(video.playlistId)!
    playlist.videoCount++
    playlist.totalDuration += video.durationSeconds
  }

  const playlists = Array.from(playlistMap.values()).sort(
    (a, b) => b.year - a.year
  )

  // 建立最終資料結構
  const data: GeneratedData = {
    meta: {
      generatedAt: new Date().toISOString(),
      totalVideos: videos.length,
      totalYears: years.length,
      years,
    },
    playlists,
    videosByYear,
  }

  // 確保輸出目錄存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  // 寫入完整資料
  const fullDataPath = path.join(OUTPUT_DIR, 'videos.json')
  fs.writeFileSync(fullDataPath, JSON.stringify(data, null, 2))
  console.log(`✅ 完整資料已寫入: ${fullDataPath}`)

  // 寫入摘要資料（供首頁使用，較小）
  const summaryPath = path.join(OUTPUT_DIR, 'summary.json')
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        meta: data.meta,
        playlists: data.playlists,
      },
      null,
      2
    )
  )
  console.log(`✅ 摘要資料已寫入: ${summaryPath}`)

  // 按年度分別寫入（供動態載入）
  for (const year of years) {
    const yearPath = path.join(OUTPUT_DIR, `year-${year}.json`)
    fs.writeFileSync(
      yearPath,
      JSON.stringify(
        {
          year,
          videos: videosByYear[year],
        },
        null,
        2
      )
    )
  }
  console.log(`✅ 各年度資料已寫入: ${years.length} 個檔案`)

  // 統計資訊
  console.log('\n📈 統計資訊:')
  console.log(`   總影片數: ${videos.length}`)
  console.log(`   學年度數: ${years.length}`)
  console.log(
    `   有題目的影片: ${videos.filter((v) => v.question).length}`
  )
  console.log(
    `   總時長: ${Math.round(videos.reduce((sum, v) => sum + v.durationSeconds, 0) / 3600)} 小時`
  )

  console.log('\n✨ 資料產生完成！')
}

main().catch(console.error)
