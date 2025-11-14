'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Survey } from 'survey-react-ui'
import { Model } from 'survey-core'
import 'survey-core/survey-core.min.css'

interface QuestionnairePageProps {
  token?: string
}

interface QuestionnaireData {
  [key: string]: unknown
}

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ token }) => {
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData | null>(null)
  const [loading, setLoading] = useState(true)
  const { errorNotification, successNotification } = useNotification()

  const survey = useMemo(() => {
    if (!questionnaireData) return null
    const surveyModel = new Model(questionnaireData)

    surveyModel.onCompleting.add(async (sender, options) => {
      try {
        const response = await fetch('/api/questionnaire', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: sender.data,
          }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          options.allow = false
          errorNotification({
            title: 'Submission Failed',
            description: result.message || 'Could not submit questionnaire. Please try again.',
          })
          return
        }

        successNotification({
          title: 'Questionnaire Submitted',
          description: 'Your questionnaire has been submitted successfully.',
        })
      } catch (error) {
        options.allow = false
        console.error('Error submitting questionnaire:', error)
        errorNotification({
          title: 'Error',
          description: 'An unexpected error occurred while submitting. Please try again.',
        })
      }
    })

    return surveyModel
  }, [questionnaireData, token, successNotification, errorNotification])

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (!token) {
        errorNotification({
          title: 'Missing Token',
          description: 'No authentication token provided. Please check your link.',
        })
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/questionnaire', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        console.log('API response:', result)
        if (response.ok && result.success) {
          console.log('Survey data:', result.data)
          setQuestionnaireData(result.data.jsonconfig)
          setLoading(false)
          return
        }

        errorNotification({
          title: 'Failed to Load Questionnaire',
          description: result.message || 'Could not load questionnaire. Please try again.',
        })
      } catch (error) {
        console.error('Error fetching questionnaire:', error)
        errorNotification({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionnaire()
  }, [token, errorNotification])

  if (loading) {
    return (
      <div className="relative z-20 shadow-2xl bg-white rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (!questionnaireData) {
    return (
      <div className="relative z-20 shadow-2xl bg-white rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground">Unable to load questionnaire. Please try again later.</p>
        </div>
      </div>
    )
  }

  if (!survey) return null

  return (
    <div className="relative z-20 shadow-2xl bg-white rounded-lg flex flex-col justify-center mx-auto my-auto py-8 px-6 w-full max-w-4xl">
      <Survey model={survey} />
    </div>
  )
}
