'use client'

import React, { useMemo } from 'react'
import { extractQuestions } from '../responses-tab/extract-questions'
import { renderAnswer } from '../utils/render-answer'

type AssessmentResponseViewProps = {
  jsonconfig: unknown
  data: unknown
}

const AssessmentResponseView: React.FC<AssessmentResponseViewProps> = ({ jsonconfig, data }) => {
  const questions = useMemo(() => extractQuestions(jsonconfig), [jsonconfig])
  const responseData = useMemo(() => {
    if (!data || typeof data !== 'object' || !questions.length) return []
    const answers = data as Record<string, unknown>
    return questions.map((q) => ({
      question: q.title,
      answer: renderAnswer(answers[q.name]),
    }))
  }, [data, questions])

  if (responseData.length === 0) {
    return <p className="text-sm text-muted-foreground">No answers found.</p>
  }

  return (
    <div className="space-y-4">
      {responseData.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <p className="text-sm font-medium">{item.question}</p>
          <p className="text-sm text-muted-foreground">{item.answer}</p>
        </div>
      ))}
    </div>
  )
}

export default AssessmentResponseView
