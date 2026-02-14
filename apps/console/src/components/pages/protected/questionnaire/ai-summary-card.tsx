'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Sparkles, Loader2, Smile, Meh, Frown } from 'lucide-react'
import { aiEnabled } from '@repo/dally/ai'
import { extractQuestions } from './responses-tab/extract-questions'

type SummaryResult = {
  summary: string
  key_themes: string
  overall_sentiment: 'Positive' | 'Neutral' | 'Negative'
  sentiment_breakdown: {
    positive: number
    neutral: number
    negative: number
  }
}

type AISummaryCardProps = {
  jsonconfig: unknown
  responses: Array<{
    document?: { data: unknown } | null
  }>
}

const sentimentConfig: Record<string, { color: string; bgColor: string; Icon: React.ComponentType<{ className?: string }> }> = {
  Positive: { color: 'text-[#09151d]', bgColor: 'bg-svg-secondary', Icon: Smile },
  Neutral: { color: 'text-[#ff842c]', bgColor: 'bg-warning/16', Icon: Meh },
  Negative: { color: 'text-destructive', bgColor: 'bg-destructive/16', Icon: Frown },
}

export const AISummaryCard = ({ jsonconfig, responses }: AISummaryCardProps) => {
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!aiEnabled) return null

  const completedResponses = responses.filter((r) => r.document?.data)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const questions = extractQuestions(jsonconfig)
      const responseData = completedResponses.map((r) => ({
        answers: r.document?.data && typeof r.document.data === 'object' ? r.document.data : {},
      }))

      const res = await fetch('/api/questionnaire-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, responses: responseData }),
      })

      if (!res.ok) throw new Error('Failed to generate summary')

      const data = await res.json()
      setResult(data)
    } catch {
      setError('Failed to generate AI summary. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const sentiment = result ? sentimentConfig[result.overall_sentiment] || sentimentConfig.Neutral : null

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h3 className="text-sm font-bold">AI Summary & Sentiment</h3>
          </div>
          {!result && (
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading || completedResponses.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Generate'
              )}
            </Button>
          )}
        </div>

        {completedResponses.length === 0 && !result && <p className="text-sm text-muted-foreground">No completed responses to analyze.</p>}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{result.summary}</p>
            <p className="text-sm leading-relaxed">{result.key_themes}</p>
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Overall Sentiment:</span>
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${sentiment?.bgColor}`}>{sentiment && <sentiment.Icon className={`h-5 w-5 ${sentiment.color}`} />}</div>
                  <span className="text-sm font-bold">{result.overall_sentiment}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
