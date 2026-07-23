'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useDomainScanNotification } from '@/hooks/useDomainScanNotification'
import { useNotification } from '@/hooks/useNotification'
import { useCreateOnboarding } from '@/lib/graphql-hooks/onboarding'
import { buildOnboardingInput, getSelectedFrameworkLabels } from '@/lib/onboarding-questions/submit-mapping'
import { type OnboardingQuestion, type SubmitStage } from '@/lib/onboarding-questions/types'
import { setOnboardingFrameworks } from '@/lib/storage/onboarding-frameworks'
import { setOnboardingTasksPending } from '@/lib/storage/onboarding-tasks-pending'
import { handleSSORedirect, switchOrganization } from '@/lib/user'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const ORGANIZATION_READY_WAIT_MS = 10000

export const useOnboardingSubmit = (allQuestions: OnboardingQuestion[]) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: sessionData, update: updateSession } = useSession()
  const { setPendingToken } = useWebSocketClient()
  const { mutateAsync: createOnboarding } = useCreateOnboarding()
  const { errorNotification } = useNotification()
  const { domainScanNotification, reviewDomainScanFindings } = useDomainScanNotification()
  const { addNewNotificationListener } = useNotificationsContext()

  const [submitStage, setSubmitStage] = useState<SubmitStage>('form')
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const [organizationReady, setOrganizationReady] = useState(false)
  const [organizationReadyWaitOver, setOrganizationReadyWaitOver] = useState(false)

  useEffect(() => {
    return addNewNotificationListener((notification) => {
      if (notification.topic === NotificationNotificationTopic.ORGANIZATION_READY) {
        setOrganizationReady(true)
      }
    })
  }, [addNewNotificationListener])

  useEffect(() => {
    if (submitStage !== 'transition' || !workspaceReady) return

    const timeout = setTimeout(() => setOrganizationReadyWaitOver(true), ORGANIZATION_READY_WAIT_MS)
    return () => clearTimeout(timeout)
  }, [submitStage, workspaceReady])

  useEffect(() => {
    if (submitStage !== 'transition' || !workspaceReady) return
    if (organizationReady || organizationReadyWaitOver) {
      setSubmitStage('ready')
    }
  }, [submitStage, workspaceReady, organizationReady, organizationReadyWaitOver])

  useEffect(() => {
    if (submitStage !== 'ready' || !sessionData?.user || !sessionData.user.isOnboarding) return

    updateSession({
      user: {
        ...sessionData.user,
        isOnboarding: false,
      },
    })
  }, [submitStage, sessionData, updateSession])

  const notifyFailure = (error: unknown) =>
    errorNotification({
      title: 'Error',
      description: parseErrorMessage(error),
    })

  const performOnboarding = async (formValues: Record<string, unknown>) => {
    const response = await createOnboarding({
      input: buildOnboardingInput(allQuestions, formValues),
    })

    if (!response?.createOnboarding) {
      throw new Error('Unexpected response format')
    }

    const orgId = response.createOnboarding.onboarding.organizationID
    if (!orgId) return null

    setOnboardingFrameworks(getSelectedFrameworkLabels(allQuestions, formValues), orgId)
    setOnboardingTasksPending(orgId)

    const switchResponse = await switchOrganization({
      target_organization_id: orgId,
    })

    if (handleSSORedirect(switchResponse)) {
      return 'sso-redirect' as const
    }

    if (!sessionData || !switchResponse) return null

    if (switchResponse.access_token) {
      setPendingToken(switchResponse.access_token)
    }

    await updateSession({
      ...switchResponse.session,
      user: {
        ...sessionData.user,
        accessToken: switchResponse.access_token,
        activeOrganizationId: orgId,
        refreshToken: switchResponse.refresh_token,
      },
    })

    requestAnimationFrame(() => {
      queryClient?.clear()
    })

    return 'success' as const
  }

  const submitOnboarding = async (formValues: Record<string, unknown>) => {
    setSubmitStage('transition')
    setWorkspaceReady(false)
    setOrganizationReadyWaitOver(false)

    try {
      const result = await performOnboarding(formValues)

      if (result === 'sso-redirect' || result === null) {
        return
      }

      setWorkspaceReady(true)
    } catch (error) {
      notifyFailure(error)
      setWorkspaceReady(false)
      setOrganizationReadyWaitOver(false)
      setSubmitStage('form')
    }
  }

  const exitOnboarding = async (formValues: Record<string, unknown>) => {
    try {
      const result = await performOnboarding(formValues)

      if (result === 'sso-redirect' || result === null) {
        return
      }

      await updateSession({ user: { isOnboarding: false } })

      router.push('/')
    } catch (error) {
      notifyFailure(error)
    }
  }

  const notifyIncompleteExit = () =>
    errorNotification({
      title: 'Some answers are still needed',
      description: 'Please complete the highlighted questions before leaving onboarding.',
    })

  const leaveOnboarding = async () => {
    await updateSession({ user: { isOnboarding: false } })
    router.push('/')
  }

  return {
    submitStage,
    submitOnboarding,
    exitOnboarding,
    notifyIncompleteExit,
    leaveOnboarding,
    domainScanNotification,
    reviewDomainScanFindings,
  }
}
