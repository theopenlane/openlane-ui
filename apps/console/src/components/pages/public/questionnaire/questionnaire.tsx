'use client'

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { Survey } from 'survey-react-ui'
import { type ITheme, Model } from 'survey-core'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import 'survey-core/survey-core.min.css'
import { jwtDecode } from 'jwt-decode'
import { useQuestionnaire, useSubmitQuestionnaire, useResendQuestionnaireLink } from '@/lib/query-hooks/questionnaire'
import { lightTheme } from '@/components/pages/protected/questionnaire/theme-light'
import { darkTheme } from '@/components/pages/protected/questionnaire/theme-dark'
import { CircleCheckBig, MailCheck } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { recaptchaSiteKey } from '@repo/dally/auth'

interface QuestionnairePageProps {
  token?: string
}

interface JWTPayload {
  email?: string | null
  assessment_id: string
  exp?: number
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

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token)
  if (!decoded?.exp) return false
  return Date.now() >= decoded.exp * 1000
}

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({ token }) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [linkResent, setLinkResent] = useState(false)
  const { errorNotification } = useNotification()
  const { data: sessionData } = useSession()
  const { resolvedTheme } = useTheme()
  const resendLink = useResendQuestionnaireLink()

  const tokenExpired = useMemo(() => {
    if (!token) return false
    return isTokenExpired(token)
  }, [token])

  const decodedToken = useMemo(() => (token ? decodeJWT(token) : null), [token])

  const hasTokenEmail = useMemo(() => Boolean(decodedToken?.email?.trim()), [decodedToken])

  const handleResendLink = useCallback(async () => {
    if (!decodedToken?.assessment_id || !decodedToken?.email) return

    let recaptchaToken = ''
    if (recaptchaSiteKey) {
      recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'questionnaire_resend' })
    }

    try {
      await resendLink.mutateAsync({
        assessmentId: decodedToken.assessment_id,
        email: decodedToken.email,
        recaptchaToken,
      })
      setLinkResent(true)
    } catch (err) {
      console.error('error resending questionnaire link', err)
    }
  }, [decodedToken, resendLink])

  const emailMismatch = useMemo(() => {
    if (!token) return false
    const isAuthenticated = !!sessionData?.user
    if (!isAuthenticated) return false

    const decoded = decodeJWT(token)
    const anonEmail = decoded?.email
    const sessionEmail = sessionData?.user?.email

    if (!anonEmail) return true
    if (anonEmail !== sessionEmail) return true

    return false
  }, [token, sessionData])

  const { data: questionnaireResponse, isLoading: loading } = useQuestionnaire({
    token,
    enabled: !!token && !emailMismatch && !tokenExpired,
  })

  const questionnaireData = questionnaireResponse?.data?.jsonconfig ?? null
  const savedData = questionnaireResponse?.data?.saved_data ?? null
  const submitQuestionnaire = useSubmitQuestionnaire()

  const submitRef = useRef(submitQuestionnaire)

  useEffect(() => {
    submitRef.current = submitQuestionnaire
  }, [submitQuestionnaire])

  const survey = useMemo(() => {
    if (!questionnaireData || !token) return null
    const surveyModel = new Model(questionnaireData)

    if (savedData) {
      surveyModel.data = savedData
    }

    return surveyModel
  }, [questionnaireData, token, savedData])

  useEffect(() => {
    if (!survey || !token) return

    survey.addNavigationItem({
      id: 'save-draft-btn',
      title: 'Save as Draft',
      enabled: hasTokenEmail,
      visibleIndex: 49,
      action: async () => {
        if (!hasTokenEmail) return

        try {
          const draftPayload = {
            token,
            data: survey.data,
            isDraft: true,
          }
          await submitRef.current.mutateAsync(draftPayload)
        } catch (error) {
          console.error('Error saving draft:', error)
        }
      },
    })

    survey.onCompleting.add(async (sender, options) => {
      try {
        await submitRef.current.mutateAsync({
          token,
          data: sender.data,
        })
        setIsSubmitted(true)
      } catch (error) {
        options.allow = false
        console.error('Error submitting questionnaire:', error)
      }
    })
  }, [survey, token, hasTokenEmail])

  useEffect(() => {
    if (!survey) return
    if (resolvedTheme === 'dark') {
      survey.applyTheme(darkTheme as ITheme)
    } else {
      survey.applyTheme(lightTheme)
    }
  }, [survey, resolvedTheme])

  useEffect(() => {
    if (!token) {
      errorNotification({
        title: 'Missing Token',
        description: 'No authentication token provided. Please check your link.',
      })
      return
    }

    if (emailMismatch) {
      const decoded = decodeJWT(token)
      const anonEmail = decoded?.email

      if (!anonEmail) {
        errorNotification({
          title: 'Invalid Token',
          description: 'The questionnaire token does not contain a valid email.',
        })
      } else {
        errorNotification({
          title: 'Email Mismatch',
          description: 'The questionnaire token does not match your current logged-in account.',
        })
      }
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

  if (tokenExpired && token) {
    return (
      <div className="relative z-20 shadow-2xl bg-white dark:bg-card rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg">
        <div className="flex flex-col items-center space-y-4">
          {linkResent ? (
            <>
              <MailCheck size={37} className="text-brand" strokeWidth={1.5} />
              <p className="text-sm font-medium text-center">New Link Sent</p>
              <p className="text-sm text-muted-foreground text-center">
                A new authentication link has been sent to your email. Please check your inbox and use the new link to access the questionnaire.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-destructive font-medium">Link Expired</p>
              <p className="text-sm text-muted-foreground text-center">Your authentication link has expired. Please request a new one to continue.</p>
              <Button onClick={handleResendLink} loading={resendLink.isPending} variant="primary" size="md">
                Request new link
              </Button>
            </>
          )}
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
