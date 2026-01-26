/**
 * Video Parser - 解析 YouTube 頻道 TSV 資料
 * 從影片描述中萃取題目、選項
 */

export interface ParsedQuestion {
  questionText: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correctAnswer: string | null
}

export interface RawVideoData {
  playlistId: string
  playlistTitle: string
  videoIndex: number
  youtubeId: string
  videoTitle: string
  description: string
  duration: string
  createdAt: string
  views: number
  youtubeLink: string
}

export interface VideoData extends RawVideoData {
  year: number
  question: ParsedQuestion | null
  durationSeconds: number
}

/**
 * 從影片描述中解析題目與選項
 */
export function parseQuestionFromDescription(
  description: string
): ParsedQuestion | null {
  if (!description || description.trim() === '') {
    return null
  }

  // 檢查是否包含選項格式 (A) (B) (C) (D)
  const optionPattern = /\(A\)\s*(\S+)\s*\(B\)\s*(\S+)\s*\(C\)\s*(\S+)\s*\(D\)\s*(\S+)/i
  const optionMatch = description.match(optionPattern)

  if (!optionMatch) {
    return null
  }

  // 檢查是否有題目（有填空符號 _____ 或類似的）
  const hasBlank = /_{2,}|_{1}\s*_/.test(description)
  if (!hasBlank) {
    return null
  }

  // 提取題目文字（選項之前的部分）
  const questionEndIndex = description.indexOf('(A)')
  if (questionEndIndex === -1) {
    return null
  }

  let questionText = description.substring(0, questionEndIndex).trim()

  // 移除開頭的數字編號（如 "1." "2." 等）
  questionText = questionText.replace(/^\d+\.\s*/, '')

  return {
    questionText,
    options: {
      A: optionMatch[1],
      B: optionMatch[2],
      C: optionMatch[3],
      D: optionMatch[4],
    },
    correctAnswer: null,
  }
}

/**
 * 解析 TSV 單行資料
 */
export function parseTsvLine(line: string): RawVideoData | null {
  if (!line || line.trim() === '') {
    return null
  }

  const columns = line.split('\t')

  // 跳過標題行
  if (
    columns[0] === '播放清單_ID' ||
    columns[0]?.includes('YouTube頻道資料匯出') ||
    columns[0]?.includes('YT頻道_id')
  ) {
    return null
  }

  // 跳過頻道資訊行（只有3列且第三列是數字）
  if (columns.length === 3 && !isNaN(parseInt(columns[2]))) {
    return null
  }

  // 確保有足夠的欄位（標準資料行有11欄）
  if (columns.length < 10) {
    return null
  }

  // 確保 videoIndex 是數字
  const videoIndex = parseInt(columns[2])
  if (isNaN(videoIndex)) {
    return null
  }

  return {
    playlistId: columns[0],
    playlistTitle: columns[1],
    videoIndex,
    youtubeId: columns[3],
    videoTitle: columns[4],
    description: columns[5],
    duration: columns[6],
    createdAt: columns[7],
    views: parseInt(columns[8]) || 0,
    youtubeLink: columns[9],
  }
}

/**
 * 從 playlist 標題提取學年度
 */
function extractYear(playlistTitle: string): number {
  const yearMatch = playlistTitle.match(/(\d{2,3})\s*學年度?|(\d{2,3})\s*大學學測/)
  if (yearMatch) {
    return parseInt(yearMatch[1] || yearMatch[2])
  }
  return 0
}

/**
 * 將時間字串轉換為秒數
 * 支援格式: "15:56", "5:30", "1:05:30"
 */
function durationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number)

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1]
  }

  return 0
}

/**
 * 完整解析影片資料
 */
export function parseVideoData(raw: RawVideoData): VideoData {
  return {
    ...raw,
    year: extractYear(raw.playlistTitle),
    question: parseQuestionFromDescription(raw.description),
    durationSeconds: durationToSeconds(raw.duration),
  }
}

/**
 * 解析整個 TSV 檔案內容
 */
export function parseTsvContent(content: string): VideoData[] {
  const lines = content.split('\n')
  const videos: VideoData[] = []

  for (const line of lines) {
    const rawData = parseTsvLine(line)
    if (rawData) {
      videos.push(parseVideoData(rawData))
    }
  }

  return videos
}

/**
 * 按學年度分組影片
 */
export function groupVideosByYear(videos: VideoData[]): Record<number, VideoData[]> {
  return videos.reduce(
    (acc, video) => {
      const year = video.year
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(video)
      return acc
    },
    {} as Record<number, VideoData[]>
  )
}
