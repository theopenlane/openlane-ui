'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { TrustCenterTrustCenterPreviewStatus } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useNotification } from '@/hooks/useNotification'
import { canEdit } from '@/lib/authz/utils'
import { useSetupTrustCenterDomains, useGetTrustCenter, usePollTrustCenterPreviewDomain } from '@/lib/graphql-hooks/trust-center'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { createOrgPersistedStore, useOrgPersistedState } from '@/lib/storage/org-persisted-store'
import { isRecord } from '@/utils/type-guards'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const ATTEMPT_WINDOW_MS = 2 * 60 * 1000 // 2min
const ATTEMPT_POLL_INTERVAL_MS = 3000 // 3s
const PROVISIONING_POLL_INTERVAL_MS = 30_000 // 30s

type TUrlCreationAttempt = { trustCenterId: string; startedAt: number }

const isAttemptExpired = (startedAt: number) => Date.now() - startedAt >= ATTEMPT_WINDOW_MS

const parseAttempt = (raw: string): TUrlCreationAttempt | null => {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.trustCenterId !== 'string' || typeof parsed.startedAt !== 'number') return null
    if (isAttemptExpired(parsed.startedAt)) return null
    return { trustCenterId: parsed.trustCenterId, startedAt: parsed.startedAt }
  } catch {
    return null
  }
}

const urlCreationAttemptStore = createOrgPersistedStore<TUrlCreationAttempt | null>('trust-center-url-creation-attempt', parseAttempt, () => null)

export const useCreateTrustCenterUrls = () => {
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { value: storedAttempt, setValue: setAttempt } = useOrgPersistedState(urlCreationAttemptStore, session?.user?.activeOrganizationId)
  const [expiredStartedAt, setExpiredStartedAt] = useState<number | null>(() => (storedAttempt && isAttemptExpired(storedAttempt.startedAt) ? storedAttempt.startedAt : null))
  const isSubmittingRef = useRef(false)

  const { trustCenter, isPlaceholderData, refetch } = useGetTrustCenter()
  const { mutateAsync: setupDomains } = useSetupTrustCenterDomains()

  const trustCenterId = trustCenter?.id
  const hasPreviewDomain = !!trustCenter?.previewDomain
  const { data: permission, isPending: isResolvingAccess } = useAccountRoles(ObjectTypes.TRUST_CENTER, trustCenterId, !hasPreviewDomain)

  const attempt = storedAttempt?.trustCenterId === trustCenterId ? storedAttempt : null
  const isPending = !hasPreviewDomain && !!attempt
  const isCreating = isPending && attempt.startedAt !== expiredStartedAt

  const previewStatus = trustCenter?.previewStatus
  usePollTrustCenterPreviewDomain({
    enabled: isCreating || previewStatus === TrustCenterTrustCenterPreviewStatus.PROVISIONING,
    intervalMs: isCreating ? ATTEMPT_POLL_INTERVAL_MS : PROVISIONING_POLL_INTERVAL_MS,
    hasPreviewDomain,
    previewStatus,
  })

  useEffect(() => {
    if (!storedAttempt) return
    const timer = setTimeout(() => setExpiredStartedAt(storedAttempt.startedAt), Math.max(0, storedAttempt.startedAt + ATTEMPT_WINDOW_MS - Date.now()))
    return () => clearTimeout(timer)
  }, [storedAttempt])

  useEffect(() => {
    if (!attempt || !hasPreviewDomain) return
    setAttempt(null)
    successNotification({ title: 'Your preview URL was created' })
  }, [attempt, hasPreviewDomain, setAttempt, successNotification])

  const create = async () => {
    if (isSubmittingRef.current || isPlaceholderData || !trustCenterId || hasPreviewDomain) return

    isSubmittingRef.current = true
    setAttempt({ trustCenterId, startedAt: Date.now() })
    try {
      await setupDomains({ trustCenterID: trustCenterId })
    } catch (error) {
      setAttempt(null)
      const { data } = await refetch()
      if (!data?.trustCenters?.edges?.[0]?.node?.previewDomain) {
        errorNotification({ title: 'Your Trust Center URLs could not be created', description: parseErrorMessage(error) })
      }
    } finally {
      isSubmittingRef.current = false
    }
  }

  return { create, canCreate: canEdit(permission?.roles, session), isResolvingAccess, isCreating, isTakingLong: isPending && !isCreating }
}

export type TCreateTrustCenterUrls = ReturnType<typeof useCreateTrustCenterUrls>
