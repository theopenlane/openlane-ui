'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Survey } from 'survey-react-ui'
import { ITheme, Model } from 'survey-core'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import 'survey-core/survey-core.min.css'
import { jwtDecode } from 'jwt-decode'
import { useQuestionnaire, useSubmitQuestionnaire } from '@/lib/query-hooks/questionnaire'
import { lightTheme } from '@/components/pages/protected/questionnaire/theme-light'
import { darkTheme } from '@/components/pages/protected/questionnaire/theme-dark'
import { CircleCheckBig } from 'lucide-react'

interface QuestionnairePageProps {
  token?: string
}

interface JWTPayload {
  email: string
}

const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const decoded: JWTPayload = jwtDecode(token)
    return decoded
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ token }) => {
  const [emailMismatch, setEmailMismatch] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { errorNotification } = useNotification()
  const { data: sessionData } = useSession()
  const { resolvedTheme } = useTheme()

  const { data: questionnaireResponse, isLoading: loading } = useQuestionnaire({
    token,
    enabled: !!token && !emailMismatch,
  })

  const questionnaireData = questionnaireResponse?.data?.jsonconfig ?? null
  const submitQuestionnaire = useSubmitQuestionnaire()

  const survey = useMemo(() => {
    if (!questionnaireData || !token) return null
    const surveyModel = new Model(questionnaireData)

    surveyModel.onCompleting.add(async (sender, options) => {
      try {
        await submitQuestionnaire.mutateAsync({
          token,
          data: sender.data,
        })
        setIsSubmitted(true)
      } catch (error) {
        options.allow = false
        console.error('Error submitting questionnaire:', error)
      }
    })

    return surveyModel
  }, [questionnaireData, token, submitQuestionnaire])

  useEffect(() => {
    if (!survey) return
    if (resolvedTheme === 'dark') {
      survey.applyTheme(darkTheme as ITheme)
    } else {
      survey.applyTheme(lightTheme)
    }
  }, [survey, resolvedTheme])

  useEffect(() => {
    if (!token) return

    const isAuthenticated = !!sessionData?.user

    if (isAuthenticated) {
      const decoded = decodeJWT(token)
      const anonEmail = decoded?.email
      const sessionEmail = sessionData?.user?.email

      if (!anonEmail) {
        setEmailMismatch(true)
        errorNotification({
          title: 'Invalid Token',
          description: 'The questionnaire token does not contain a valid email.',
        })
        return
      }

      if (anonEmail !== sessionEmail) {
        setEmailMismatch(true)
        errorNotification({
          title: 'Email Mismatch',
          description: 'The questionnaire token does not match your current logged-in account.',
        })
        return
      }
    }
  }, [token, sessionData, errorNotification])

  useEffect(() => {
    if (!token && !emailMismatch) {
      errorNotification({
        title: 'Missing Token',
        description: 'No authentication token provided. Please check your link.',
      })
    }
  }, [token, emailMismatch, errorNotification])

  if (emailMismatch) {
    return (
      <div className="relative z-20 shadow-2xl bg-white dark:bg-card rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-destructive font-medium">Access Denied</p>
          <p className="text-sm text-muted-foreground text-center">
            The questionnaire token does not match your current logged-in account. Please log out and use the correct account, or ask the questionnaire creator to resend to your current email.
          </p>
          <div className="text-sm text-muted-foreground text-center">Alternatively, you can contact support.</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative z-20 shadow-2xl bg-white dark:bg-card rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (!questionnaireData) {
    return (
      <div className="relative z-20 shadow-2xl bg-white dark:bg-card rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-muted-foreground">Unable to load questionnaire. Please try again later.</p>
        </div>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="relative z-20 shadow-2xl bg-white dark:bg-card rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          <CircleCheckBig size={37} className="text-brand" strokeWidth={1.5} />
          <p className="text-sm font-medium text-center">Questionnaire Submitted Successfully</p>
          <p className="text-sm text-muted-foreground text-center">Thank you for completing the questionnaire. Your response have been submitted successfully.</p>
        </div>
      </div>
    )
  }

  if (!survey) return null

  return (
    <div className="relative z-20 shadow-2xl bg-white dark:bg-card rounded-lg flex flex-col justify-center mx-auto my-auto py-8 px-6 w-full max-w-4xl">
      <Survey model={survey} />
    </div>
  )
}
