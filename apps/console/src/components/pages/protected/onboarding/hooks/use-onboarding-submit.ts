'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useDomainScanNotification } from '@/hooks/useDomainScanNotification'
import { useNotification } from '@/hooks/useNotification'
import { useCreateOnboarding } from '@/lib/graphql-hooks/onboarding'
import { buildOnboardingInput, getExistingControls, getSelectedFrameworkLabels } from '@/lib/onboarding-questions/submit-mapping'
import { type OnboardingQuestion, type SubmitStage } from '@/lib/onboarding-questions/types'
import { clearOnboardingCreatedOrganization, getOnboardingCreatedOrganization, setOnboardingCreatedOrganization } from '@/lib/storage/onboarding-created-organization'
import { setOnboardingFrameworks } from '@/lib/storage/onboarding-frameworks'
import { setOnboardingTasksPending } from '@/lib/storage/onboarding-tasks-pending'
import { handleSSORedirect, switchOrganization } from '@/lib/user'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'
import { ClientError } from 'graphql-request'
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

  const userId = sessionData?.user?.userId
  const isSubmittingRef = useRef(false)

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

  const describeFailure = (error: unknown): string => (error instanceof Error && !(error instanceof ClientError) ? error.message : parseErrorMessage(error))

  const notifyFailure = (error: unknown) =>
    errorNotification({
      title: 'Error',
      description: describeFailure(error),
    })

  const createOnboardingOrganization = async (formValues: Record<string, unknown>, currentUserId: string) => {
    const alreadyCreatedOrgId = getOnboardingCreatedOrganization(currentUserId)
    if (alreadyCreatedOrgId) return alreadyCreatedOrgId

    const response = await createOnboarding({
      input: buildOnboardingInput(allQuestions, formValues),
    })

    const orgId = response?.createOnboarding?.onboarding?.organizationID
    if (!orgId) {
      throw new Error('Onboarding did not return an organization')
    }

    setOnboardingCreatedOrganization(orgId, currentUserId)

    return orgId
  }

  const performOnboarding = async (formValues: Record<string, unknown>) => {
    if (!sessionData || !userId) {
      throw new Error('Your session expired. Please sign in again.')
    }

    const orgId = await createOnboardingOrganization(formValues, userId)

    setOnboardingFrameworks(getSelectedFrameworkLabels(allQuestions, formValues), orgId, getExistingControls(formValues))
    setOnboardingTasksPending(orgId)

    const switchResponse = await switchOrganization({
      target_organization_id: orgId,
    })

    if (handleSSORedirect(switchResponse)) {
      return false
    }

    if (!switchResponse.access_token) {
      throw new Error(switchResponse.message ?? 'Unable to open your new workspace. Please try again.')
    }

    setPendingToken(switchResponse.access_token)

    await updateSession({
      user: {
        ...sessionData.user,
        accessToken: switchResponse.access_token,
        activeOrganizationId: orgId,
        refreshToken: switchResponse.refresh_token,
        isOnboarding: false,
      },
    })

    clearOnboardingCreatedOrganization(userId)

    requestAnimationFrame(() => {
      queryClient?.clear()
    })

    return true
  }

  const runOnboardingOnce = async (formValues: Record<string, unknown>) => {
    if (isSubmittingRef.current) return false

    isSubmittingRef.current = true

    try {
      const didComplete = await performOnboarding(formValues)

      if (!didComplete) {
        isSubmittingRef.current = false
      }

      return didComplete
    } catch (error) {
      isSubmittingRef.current = false
      throw error
    }
  }

  const submitOnboarding = async (formValues: Record<string, unknown>) => {
    if (isSubmittingRef.current) return

    setSubmitStage('transition')
    setWorkspaceReady(false)
    setOrganizationReadyWaitOver(false)

    try {
      const didComplete = await runOnboardingOnce(formValues)

      if (!didComplete) {
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
    if (isSubmittingRef.current) return

    try {
      const didComplete = await runOnboardingOnce(formValues)

      if (!didComplete) {
        return
      }

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
