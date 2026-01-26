import { describe, it, expect } from 'vitest'
import {
  parseQuestionFromDescription,
  parseTsvLine,
  parseVideoData,
  type VideoData,
  type ParsedQuestion,
} from '../../packages/data/parser/video-parser'

describe('VideoParser', () => {
  describe('parseQuestionFromDescription', () => {
    it('should extract question text and options from standard format', () => {
      const description = `The mayor has such a ______ schedule that it takes weeks to arrange an interview with her. (A) hasty (B) tight (C) diligent (D) routine`

      const result = parseQuestionFromDescription(description)

      expect(result).toEqual({
        questionText:
          'The mayor has such a ______ schedule that it takes weeks to arrange an interview with her.',
        options: {
          A: 'hasty',
          B: 'tight',
          C: 'diligent',
          D: 'routine',
        },
        correctAnswer: null, // We don't know the answer from description alone
      })
    })

    it('should handle question with number prefix', () => {
      const description = `2. Jane started as an ______ art designer, but now she has a professional studio of her own. (A) official (B) instant (C) amateur (D) elementary`

      const result = parseQuestionFromDescription(description)

      expect(result).toEqual({
        questionText:
          'Jane started as an ______ art designer, but now she has a professional studio of her own.',
        options: {
          A: 'official',
          B: 'instant',
          C: 'amateur',
          D: 'elementary',
        },
        correctAnswer: null,
      })
    })

    it('should handle multi-line description', () => {
      const description = `3. The teaching ______ at the famous high school soon attracted more than a dozen well-qualified applicants. (A) career (B) vacancy (C) expectation (D) inspiration`

      const result = parseQuestionFromDescription(description)

      expect(result).not.toBeNull()
      expect(result?.options.A).toBe('career')
      expect(result?.options.B).toBe('vacancy')
    })

    it('should return null for descriptions without question format', () => {
      const description = `106 大學學測英文科試題講解`

      const result = parseQuestionFromDescription(description)

      expect(result).toBeNull()
    })

    it('should return null for empty description', () => {
      const result = parseQuestionFromDescription('')

      expect(result).toBeNull()
    })

    it('should handle description with vocabulary notes', () => {
      const description = `balance (v.) 使平衡 (n.) 平衡；結存，結餘 conclusion (n.) 結論；推論 definition (n.) 定義；釋義 harmony (n.) 和諧；協調`

      const result = parseQuestionFromDescription(description)

      // This is vocabulary notes, not a question
      expect(result).toBeNull()
    })

    it('should handle blank in different formats', () => {
      const description1 = `The mayor has such a _____ schedule that...`
      const description2 = `The mayor has such a       schedule that...`

      // Both should be recognized as having a blank
      const result1 = parseQuestionFromDescription(
        description1 + ' (A) hasty (B) tight (C) diligent (D) routine'
      )
      expect(result1).not.toBeNull()
    })
  })

  describe('parseTsvLine', () => {
    it('should parse a standard TSV line correctly', () => {
      const line = `PL9EijNLnb2m6HP-FkscXVUzekNfRNVg65\t115 學年度大學學測 - 英文文意字彙\t1\tt346HKco1hY\t115 學年度大學學測 - 文意字彙 01\tThe mayor has such a ______ schedule that it takes weeks to arrange an interview with her. (A) hasty (B) tight (C) diligent (D) routine\t15:56\t2026-01-18T09:23:10Z\t267\thttps://www.youtube.com/watch?v=t346HKco1hY\t`

      const result = parseTsvLine(line)

      expect(result).toEqual({
        playlistId: 'PL9EijNLnb2m6HP-FkscXVUzekNfRNVg65',
        playlistTitle: '115 學年度大學學測 - 英文文意字彙',
        videoIndex: 1,
        youtubeId: 't346HKco1hY',
        videoTitle: '115 學年度大學學測 - 文意字彙 01',
        description:
          'The mayor has such a ______ schedule that it takes weeks to arrange an interview with her. (A) hasty (B) tight (C) diligent (D) routine',
        duration: '15:56',
        createdAt: '2026-01-18T09:23:10Z',
        views: 267,
        youtubeLink: 'https://www.youtube.com/watch?v=t346HKco1hY',
      })
    })

    it('should skip header line', () => {
      const headerLine = `播放清單_ID\t播放清單_title\t影片_index\t影片_YTID\t影片_title\t影片_description\t影片_length\t影片_cruatedAt\t影片_views\t影片_YTLink\t備註`

      const result = parseTsvLine(headerLine)

      expect(result).toBeNull()
    })

    it('should skip empty lines', () => {
      const result = parseTsvLine('')
      expect(result).toBeNull()
    })

    it('should skip metadata lines', () => {
      const line1 = `臺南市立大灣高中影音教學頻道 - YouTube頻道資料匯出\t匯出時間: 2026/1/26 上午1:01:16`
      const line2 = `UCfTM1s1BB8_d2MV6a1qjd6Q\t臺南市立大灣高中影音教學頻道\t3879`

      expect(parseTsvLine(line1)).toBeNull()
      expect(parseTsvLine(line2)).toBeNull()
    })
  })

  describe('parseVideoData', () => {
    it('should create complete VideoData with parsed question', () => {
      const rawData = {
        playlistId: 'PL123',
        playlistTitle: '115 學年度大學學測 - 英文文意字彙',
        videoIndex: 1,
        youtubeId: 't346HKco1hY',
        videoTitle: '115 學年度大學學測 - 文意字彙 01',
        description:
          'The mayor has such a ______ schedule. (A) hasty (B) tight (C) diligent (D) routine',
        duration: '15:56',
        createdAt: '2026-01-18T09:23:10Z',
        views: 267,
        youtubeLink: 'https://www.youtube.com/watch?v=t346HKco1hY',
      }

      const result = parseVideoData(rawData)

      expect(result.year).toBe(115)
      expect(result.question).not.toBeNull()
      expect(result.question?.options.B).toBe('tight')
      expect(result.durationSeconds).toBe(956) // 15*60 + 56
    })

    it('should extract year from playlist title', () => {
      const testCases = [
        { title: '115 學年度大學學測 - 英文文意字彙', expected: 115 },
        { title: '98 學年度大學學測 - 英文文意字彙', expected: 98 },
        { title: '109 大學學測英文科試題第一大題文意選擇', expected: 109 },
        { title: '107 大學學測文意字彙講解', expected: 107 },
        { title: '93年大學學測英文字彙解析', expected: 93 },
        { title: '95年大學學測字彙測驗講解', expected: 95 },
      ]

      testCases.forEach(({ title, expected }) => {
        const rawData = {
          playlistId: 'PL123',
          playlistTitle: title,
          videoIndex: 1,
          youtubeId: 'abc123',
          videoTitle: 'Test',
          description: 'Test _____ (A) a (B) b (C) c (D) d',
          duration: '10:00',
          createdAt: '2026-01-18T09:23:10Z',
          views: 100,
          youtubeLink: 'https://youtube.com/watch?v=abc123',
        }

        const result = parseVideoData(rawData)
        expect(result.year).toBe(expected)
      })
    })

    it('should convert duration string to seconds', () => {
      const testCases = [
        { duration: '15:56', expected: 956 },
        { duration: '5:30', expected: 330 },
        { duration: '1:05:30', expected: 3930 },
        { duration: '0:45', expected: 45 },
      ]

      testCases.forEach(({ duration, expected }) => {
        const rawData = {
          playlistId: 'PL123',
          playlistTitle: '115 學年度大學學測',
          videoIndex: 1,
          youtubeId: 'abc123',
          videoTitle: 'Test',
          description: 'Test (A) a (B) b (C) c (D) d',
          duration,
          createdAt: '2026-01-18T09:23:10Z',
          views: 100,
          youtubeLink: 'https://youtube.com/watch?v=abc123',
        }

        const result = parseVideoData(rawData)
        expect(result.durationSeconds).toBe(expected)
      })
    })
  })
})
