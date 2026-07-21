'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { subDays } from 'date-fns'
import { ScanScanStatus } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'
import { useScansWithFilter } from '@/lib/graphql-hooks/scan'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { getOrganizationStorageItem, setOrganizationStorageItem } from '@/lib/storage/organization-storage'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum'
import { applyModuleGating } from '@/lib/subscription-plan/module-aware-suggestions'

export type OnboardingItem = {
  key: string
  title: string
  description: string
  requiredModule?: PlanEnum
  fallbackDescription?: string
  dueDate?: string
  disabled?: boolean
  disabledReason?: string
  onClick: () => void
}

const COMPLETED_ONBOARDING_STORAGE_KEY = 'dashboard-dismissed-suggestions'
const DOMAIN_SCAN_PERFORMED_BY = 'openlane_domain_scan'

export const seedOnboardingChecklist = (organizationId?: string) => {
  if (getOrganizationStorageItem(COMPLETED_ONBOARDING_STORAGE_KEY, organizationId) !== null) return
  setOrganizationStorageItem(COMPLETED_ONBOARDING_STORAGE_KEY, JSON.stringify([]), organizationId)
}

export const useOnboardingChecklist = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { currentOrgId } = useOrganization()
  const { scansNodes: domainScans } = useScansWithFilter({
    where: { performedBy: DOMAIN_SCAN_PERFORMED_BY, status: ScanScanStatus.COMPLETED },
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
  })
  const completedDomainScan = domainScans[0]
  const { data: billingData } = useGetOrganizationBilling(currentOrgId)
  const trialExpiresAt = billingData?.organization?.orgSubscriptions?.[0]?.trialExpiresAt
  const paymentMethodDueDate = useMemo(() => (trialExpiresAt ? subDays(new Date(trialExpiresAt), 1).toISOString() : undefined), [trialExpiresAt])
  const [completedKeys, setCompletedKeys] = useState<string[]>([])
  const [hasStoredProgress, setHasStoredProgress] = useState(false)

  useEffect(() => {
    const raw = getOrganizationStorageItem(COMPLETED_ONBOARDING_STORAGE_KEY, currentOrgId)
    if (raw === null) {
      setHasStoredProgress(false)
      return
    }
    setHasStoredProgress(true)
    try {
      setCompletedKeys(JSON.parse(raw))
    } catch {
      console.error('Could not parse completed onboarding items from localStorage')
    }
  }, [currentOrgId])

  // these are permanently frontend-only, not a stand-in for a future backend API --
  // unlike recommendations, which are mocked here until real tasks back them.
  const rawItems: OnboardingItem[] = [
    {
      key: 'secure-organization',
      title: 'Secure your organization',
      description: 'Set up Single-Sign On, allowed domains, and permissions to keep your org safe.',
      onClick: () => router.push('/organization-settings/authentication'),
    },
    {
      key: 'invite-team',
      title: 'Invite your team',
      description: 'Add teammates so they can collaborate on controls, policies, and evidence.',
      onClick: () => router.push('/user-management/members'),
    },
    {
      key: 'setup-integrations',
      title: 'Setup Integrations',
      description: 'Automatically sync data into openlane such as personnel, assets, or documents',
      onClick: () => router.push('/automation/integrations'),
    },
    {
      key: 'domain-scan',
      title: 'Review your domain scan',
      description: 'We automatically scan your domain to find the systems, vendors, and assets behind your registry.',
      disabled: !completedDomainScan,
      disabledReason: 'Waiting on domain scan to finish',
      onClick: () => {
        if (completedDomainScan) {
          router.push(`/exposure/scans/domain-scan?scanId=${encodeURIComponent(completedDomainScan.id)}`)
        }
      },
    },
    {
      key: 'configure-trust-center',
      title: 'Configure your Trust Center',
      description: 'Customize your public trust center to share security, compliance, and privacy information with customers.',
      fallbackDescription: 'Add the Trust Center module to publicly share your security, compliance, and privacy posture with customers.',
      requiredModule: PlanEnum.TRUST_CENTER_MODULE,
      onClick: () => router.push('/trust-center/branding'),
    },
    {
      key: 'add-payment-method',
      title: 'Add a payment method',
      description: 'Add a payment method to keep your subscription active and enable paid features when your trial ends.',
      dueDate: paymentMethodDueDate,
      onClick: () => router.push('/organization-settings/billing'),
    },
  ]

  const suggestions = applyModuleGating(rawItems, session?.user?.modules ?? [], session, () => router.push('/organization-settings/billing'))

  const toggleComplete = (key: string) => {
    setCompletedKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((completedKey) => completedKey !== key) : [...prev, key]
      setOrganizationStorageItem(COMPLETED_ONBOARDING_STORAGE_KEY, JSON.stringify(next), currentOrgId)
      return next
    })
  }

  return { suggestions, completedKeys, hasStoredProgress, toggleComplete }
}
