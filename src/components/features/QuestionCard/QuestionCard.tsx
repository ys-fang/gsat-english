'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { CheckCircle2, XCircle } from 'lucide-react'

interface QuestionCardProps {
  question: {
    questionText: string
    options: {
      A: string
      B: string
      C: string
      D: string
    }
    correctAnswer: string | null
  }
  onAnswer?: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function QuestionCard({
  question,
  onAnswer,
  disabled = false,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSelect = (option: string) => {
    if (disabled || showResult) return
    setSelectedAnswer(option)
  }

  const handleConfirm = () => {
    if (!selectedAnswer) return
    setShowResult(true)

    // For now, we don't know the correct answer from the data
    // In a real app, you'd have this from a separate answer key
    const isCorrect = question.correctAnswer === selectedAnswer
    onAnswer?.(selectedAnswer, isCorrect)
  }

  const options = Object.entries(question.options) as [string, string][]

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Question Text */}
      <p className="text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
        {question.questionText}
      </p>

      {/* Options */}
      <div className="mt-6 space-y-3">
        {options.map(([key, value]) => {
          const isSelected = selectedAnswer === key
          const isCorrect = showResult && question.correctAnswer === key
          const isWrong = showResult && isSelected && question.correctAnswer !== key

          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={disabled || showResult}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                'hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20',
                'disabled:cursor-not-allowed disabled:opacity-50',
                {
                  'border-zinc-200 dark:border-zinc-700': !isSelected && !isCorrect,
                  'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30':
                    isSelected && !showResult,
                  'border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-900/30':
                    isCorrect,
                  'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30':
                    isWrong,
                }
              )}
            >
              {/* Option Label */}
              <span
                className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                  {
                    'border-zinc-300 text-zinc-500 dark:border-zinc-600':
                      !isSelected && !isCorrect,
                    'border-blue-500 bg-blue-500 text-white': isSelected && !showResult,
                    'border-green-500 bg-green-500 text-white': isCorrect,
                    'border-red-500 bg-red-500 text-white': isWrong,
                  }
                )}
              >
                {showResult ? (
                  isCorrect ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : isWrong ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    key
                  )
                ) : (
                  key
                )}
              </span>

              {/* Option Text */}
              <span
                className={cn('text-sm', {
                  'text-zinc-700 dark:text-zinc-300': !isCorrect && !isWrong,
                  'font-medium text-green-700 dark:text-green-400': isCorrect,
                  'text-red-700 dark:text-red-400': isWrong,
                })}
              >
                {value}
              </span>
            </button>
          )
        })}
      </div>

      {/* Confirm Button */}
      {!showResult && (
        <div className="mt-6">
          <Button
            onClick={handleConfirm}
            disabled={!selectedAnswer}
            variant="primary"
            className="w-full"
          >
            確認答案
          </Button>
        </div>
      )}

      {/* Result Message */}
      {showResult && (
        <div
          className={cn(
            'mt-6 rounded-lg p-4 text-center',
            question.correctAnswer === selectedAnswer
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {question.correctAnswer === selectedAnswer ? (
            <span className="flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              答對了！
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 font-medium">
              <XCircle className="h-5 w-5" />
              答錯了，正確答案是 {question.correctAnswer}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
