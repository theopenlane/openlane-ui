'use client'

import { useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Sparkles, Loader2 } from 'lucide-react'
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
    email: string
    document?: { data: unknown } | null
  }>
}

const sentimentVariant: Record<string, 'green' | 'default' | 'destructive'> = {
  Positive: 'green',
  Neutral: 'default',
  Negative: 'destructive',
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
        email: r.email,
        answers: r.document?.data,
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">AI Summary & Sentiment</h3>
          </div>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading || completedResponses.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : result ? (
              'Regenerate'
            ) : (
              'Generate'
            )}
          </Button>
        </div>

        {completedResponses.length === 0 && <p className="text-sm text-muted-foreground">No completed responses to analyze.</p>}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {result && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
              <p className="text-sm">{result.summary}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Key Themes</p>
              <p className="text-sm">{result.key_themes}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-muted-foreground">Overall Sentiment</p>
              <Badge variant={sentimentVariant[result.overall_sentiment] || 'default'}>{result.overall_sentiment}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
