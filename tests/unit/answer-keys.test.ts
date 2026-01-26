import { describe, it, expect } from 'vitest'
import answerKeys from '../../packages/data/answer-keys.json'

describe('AnswerKeys', () => {
  const validAnswers = ['A', 'B', 'C', 'D']

  describe('answerKeys structure', () => {
    it('should have answer keys for years 105-113', () => {
      const expectedYears = ['105', '106', '107', '108', '109', '110', '111', '112', '113']
      for (const year of expectedYears) {
        expect(answerKeys.answerKeys).toHaveProperty(year)
      }
    })

    it('should have valid vocabRange for each year', () => {
      for (const [year, data] of Object.entries(answerKeys.answerKeys)) {
        expect(data.vocabRange).toHaveLength(2)
        expect(data.vocabRange[0]).toBe(1)
        expect(data.vocabRange[1]).toBeGreaterThanOrEqual(10)
        expect(data.vocabRange[1]).toBeLessThanOrEqual(15)
      }
    })

    it('should have valid answer letters (A/B/C/D) for all questions', () => {
      for (const [year, data] of Object.entries(answerKeys.answerKeys)) {
        const [start, end] = data.vocabRange
        for (let q = start; q <= end; q++) {
          const answer = data.answers[String(q)]
          expect(answer, `Year ${year} Q${q}`).toBeDefined()
          expect(validAnswers, `Year ${year} Q${q} has invalid answer: ${answer}`).toContain(answer)
        }
      }
    })

    it('should have 15 answers for years 105-110 and 10 for 111-113', () => {
      for (const year of ['105', '106', '107', '108', '109', '110']) {
        expect(Object.keys(answerKeys.answerKeys[year as keyof typeof answerKeys.answerKeys].answers)).toHaveLength(15)
      }
      for (const year of ['111', '112', '113']) {
        expect(Object.keys(answerKeys.answerKeys[year as keyof typeof answerKeys.answerKeys].answers)).toHaveLength(10)
      }
    })
  })

  describe('supplementaryQuestions structure', () => {
    it('should have supplementary questions for years 106-109', () => {
      const expectedYears = ['106', '107', '108', '109']
      for (const year of expectedYears) {
        expect(answerKeys.supplementaryQuestions).toHaveProperty(year)
      }
    })

    it('should have 15 questions per supplementary year', () => {
      for (const [year, questions] of Object.entries(answerKeys.supplementaryQuestions)) {
        expect(Object.keys(questions), `Year ${year}`).toHaveLength(15)
      }
    })

    it('should have valid question structure with text and ABCD options', () => {
      for (const [year, questions] of Object.entries(answerKeys.supplementaryQuestions)) {
        for (const [qNum, q] of Object.entries(questions)) {
          expect(q.questionText, `Year ${year} Q${qNum} text`).toBeTruthy()
          expect(q.questionText, `Year ${year} Q${qNum} should have blank`).toContain('_____')
          expect(q.options, `Year ${year} Q${qNum} options`).toHaveProperty('A')
          expect(q.options, `Year ${year} Q${qNum} options`).toHaveProperty('B')
          expect(q.options, `Year ${year} Q${qNum} options`).toHaveProperty('C')
          expect(q.options, `Year ${year} Q${qNum} options`).toHaveProperty('D')
        }
      }
    })
  })

  describe('generated data integrity', () => {
    it('should have answer keys that match supplementary questions', () => {
      // For years that have both answer keys and supplementary questions,
      // verify the answer corresponds to one of the options
      for (const [year, questions] of Object.entries(answerKeys.supplementaryQuestions)) {
        const yearKey = answerKeys.answerKeys[year as keyof typeof answerKeys.answerKeys]
        if (!yearKey) continue

        for (const [qNum, q] of Object.entries(questions)) {
          const answer = yearKey.answers[qNum]
          if (!answer) continue
          const optionValue = q.options[answer as keyof typeof q.options]
          expect(optionValue, `Year ${year} Q${qNum} answer ${answer} should map to an option`).toBeTruthy()
        }
      }
    })
  })
})
