'use client'

import React, { useMemo } from 'react'
import { extractQuestions } from '../responses-tab/extract-questions'
import { renderAnswer } from '../utils/render-answer'

type AssessmentResponseViewProps = {
  jsonconfig: unknown
  data: unknown
  maxItems?: number
}

export const countAnswered = (jsonconfig: unknown, data: unknown): { answered: number; total: number } => {
  const questions = extractQuestions(jsonconfig)
  if (!data || typeof data !== 'object') return { answered: 0, total: questions.length }
  const answers = data as Record<string, unknown>
  const answered = questions.filter((q) => {
    const value = answers[q.name]
    return value != null && value !== ''
  }).length
  return { answered, total: questions.length }
}

const AssessmentResponseView: React.FC<AssessmentResponseViewProps> = ({ jsonconfig, data, maxItems }) => {
  const questions = useMemo(() => extractQuestions(jsonconfig), [jsonconfig])
  const responseData = useMemo(() => {
    if (!data || typeof data !== 'object' || !questions.length) return []
    const answers = data as Record<string, unknown>
    return questions.map((q) => ({
      question: q.title,
      answer: renderAnswer(answers[q.name], q.type),
    }))
  }, [data, questions])

  if (responseData.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers found.</p>
  }

  const shown = maxItems ? responseData.slice(0, maxItems) : responseData
  const hiddenCount = responseData.length - shown.length

  return (
    <div className="space-y-4">
      {shown.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <p className="text-sm font-medium">{item.question}</p>
          <p className="text-sm text-muted-foreground">{item.answer}</p>
        </div>
      ))}
      {hiddenCount > 0 && <p className="text-xs text-muted-foreground">+{hiddenCount} more. Click to see the full response.</p>}
    </div>
  )
}

export default AssessmentResponseView
