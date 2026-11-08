'use client'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Database, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useNotification } from '@/hooks/useNotification'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { DEMO_DATASET, type TDemoDataPresence, useDeleteDemoData, useDemoDataPresence, useSeedDemoData } from '@/lib/graphql-hooks/demo-data'
import { useHasOrgFullAccess } from '@/lib/query-hooks/permissions'
import { type Notification } from '@/lib/graphql-hooks/notifications'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { isRecord } from '@/utils/type-guards'
import { ManagementRow } from './management-row'

const DEMO_DATA_SECTION_ID = 'demo-data'
const DEMO_DATA_SETTINGS_URL = `/organization-settings/general-settings#${DEMO_DATA_SECTION_ID}`

const PENDING_POLL_INTERVAL_MS = 5000 // 5s
const PENDING_TIMEOUT_MS = 10 * 60 * 1000 // 10min

type TPendingAction = 'seed' | 'delete'

type TActionConfig = {
  isOutcome: (notification: Notification) => boolean
  isSettled: (presence: TDemoDataPresence) => boolean
  started: string
  startedDescription: string
  failed: string
  inFlight: string
}

const ACTIONS: Record<TPendingAction, TActionConfig> = {
  seed: {
    isOutcome: (notification) => notification.objectType === 'import.completed' && isRecord(notification.data) && notification.data.url === DEMO_DATA_SETTINGS_URL,
    isSettled: (presence) => presence.hasAll,
    started: 'Adding demo data',
    startedDescription: "You'll receive a notification when the sample records are ready.",
    failed: 'Unable to add demo data',
    inFlight: 'Adding...',
  },
  delete: {
    isOutcome: (notification) => notification.objectType === 'delete.completed',
    isSettled: (presence) => !presence.hasAny,
    started: 'Removing demo data',
    startedDescription: "You'll receive a notification when the sample records are removed.",
    failed: 'Unable to remove demo data',
    inFlight: 'Removing...',
  },
}

const STATUS_UNAVAILABLE_REASON = "We couldn't check whether demo data is present. Please try again later."

const ROW_COPY: Record<TPendingAction | 'absent' | 'present', { title: string; description: string }> = {
  absent: { title: 'Explore with demo data', description: 'Add sample records to explore Openlane and remove them whenever you want.' },
  present: { title: 'Demo data added', description: "Remove the sample records added to your organization. Your own data won't be affected." },
  seed: { title: 'Adding demo data', description: "Sample records are being added to your organization. Feel free to navigate away, you'll receive a notification when they're ready." },
  delete: { title: 'Removing demo data', description: "Sample records are being removed from your organization. Feel free to navigate away, you'll receive a notification when it's done." },
}

const DemoData = () => {
  const hasFullAccess = useHasOrgFullAccess()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { addNewNotificationListener } = useNotificationsContext()
  const [pendingAction, setPendingAction] = useState<TPendingAction | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const hasScrolledRef = useRef(false)
  const isDispatchingRef = useRef(false)

  const { data: presence, isPending, error } = useDemoDataPresence({ enabled: hasFullAccess, refetchInterval: pendingAction ? PENDING_POLL_INTERVAL_MS : false })
  const { mutateAsync: seedDemoData, isPending: isSeeding } = useSeedDemoData()
  const { mutateAsync: deleteDemoData, isPending: isDeleting } = useDeleteDemoData()

  useQueryErrorNotification({ error, description: 'Failed to load demo data status' })

  useEffect(() => {
    if (!pendingAction) return
    return addNewNotificationListener((notification) => {
      if (!ACTIONS[pendingAction].isOutcome(notification)) return
      setPendingAction(null)
      queryClient.invalidateQueries()
    })
  }, [pendingAction, addNewNotificationListener, queryClient])

  useEffect(() => {
    if (!pendingAction || !presence || !ACTIONS[pendingAction].isSettled(presence)) return
    setPendingAction(null)
    queryClient.invalidateQueries()
  }, [pendingAction, presence, queryClient])

  useEffect(() => {
    if (!pendingAction) return
    const timeout = setTimeout(() => setPendingAction(null), PENDING_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [pendingAction])

  useEffect(() => {
    const scrollToSection = () => {
      if (window.location.hash === `#${DEMO_DATA_SECTION_ID}`) sectionRef.current?.scrollIntoView({ block: 'start' })
    }
    window.addEventListener('hashchange', scrollToSection)
    if (!isPending && !hasScrolledRef.current) {
      hasScrolledRef.current = true
      scrollToSection()
    }
    return () => window.removeEventListener('hashchange', scrollToSection)
  }, [isPending])

  if (!hasFullAccess) {
    return null
  }

  const runAction = async (action: TPendingAction) => {
    if (isDispatchingRef.current) return
    isDispatchingRef.current = true
    const mutate = action === 'seed' ? seedDemoData : deleteDemoData
    try {
      await mutate({ input: { dataset: DEMO_DATASET } })
      setPendingAction(action)
      successNotification({ title: ACTIONS[action].started, description: ACTIONS[action].startedDescription })
    } catch (err) {
      errorNotification({ title: ACTIONS[action].failed, description: parseErrorMessage(err) })
    } finally {
      isDispatchingRef.current = false
    }
  }

  const copy = ROW_COPY[pendingAction ?? (presence?.hasAny ? 'present' : 'absent')]

  const renderAction = () => {
    if (pendingAction) {
      return (
        <Button variant="secondary" type="button" loading disabled>
          {ACTIONS[pendingAction].inFlight}
        </Button>
      )
    }

    if (presence?.hasAny) {
      return (
        <Button variant="destructiveOutline" type="button" icon={<Trash2 />} iconPosition="left" disabled={isDeleting} loading={isDeleting} onClick={() => setIsConfirmOpen(true)}>
          Remove demo data
        </Button>
      )
    }

    const unavailableReason = presence ? null : STATUS_UNAVAILABLE_REASON

    return (
      <DisabledReasonTooltip reason={unavailableReason}>
        <Button type="button" disabled={isSeeding || !!unavailableReason} loading={isSeeding} onClick={() => runAction('seed')}>
          Add demo data
        </Button>
      </DisabledReasonTooltip>
    )
  }

  return (
    <section id={DEMO_DATA_SECTION_ID} ref={sectionRef} className="scroll-mt-4">
      <Panel>
        <PanelHeader heading="Demo data" noBorder />
        {isPending ? (
          <div role="status" aria-live="polite" aria-label="Loading demo data" className="flex items-center gap-4">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="flex w-full flex-col gap-2">
              <Skeleton height={16} className="w-full max-w-[180px] rounded-md" />
              <Skeleton height={14} className="w-full max-w-[420px] rounded-md" />
            </div>
          </div>
        ) : (
          <ManagementRow icon={<Database className="size-5" />} iconClassName="rounded-lg bg-primary/15 text-primary" title={copy.title} description={copy.description} action={renderAction()} />
        )}
      </Panel>

      <ConfirmationDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={() => runAction('delete')}
        confirmationText="Remove demo data"
        title="Remove demo data"
        description="This removes every sample record added to your organization. Records you created yourself are not affected."
      />
    </section>
  )
}

export { DemoData }
