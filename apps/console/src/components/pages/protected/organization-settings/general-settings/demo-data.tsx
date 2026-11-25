'use client'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Database, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useNotification } from '@/hooks/useNotification'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { DEMO_DATA_SECTION_ID, DEMO_DATASET, useDeleteDemoData, useDemoDataPresence, useSeedDemoData } from '@/lib/graphql-hooks/demo-data'
import { createDemoDataDeleteJob, DEMO_DATA_POLL_INTERVAL_MS, DEMO_DATA_SEED_JOB, type TDemoDataJob, useDemoDataJobWatch } from '@/hooks/useDemoDataJobWatch'
import { DEMO_DATA_TYPES, type TDemoDataTypeKey, toKeptSchemas } from '@/constants/demo-data-types'
import { useHasOrgFullAccess } from '@/lib/query-hooks/permissions'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ManagementRow } from './management-row'
import { RemoveDemoDataDialog } from './remove-demo-data/remove-demo-data-dialog'

type TPendingAction = TDemoDataJob['action']

type TActionConfig = {
  started: string
  startedDescription: string
  failed: string
  inFlight: string
}

const ACTIONS: Record<TPendingAction, TActionConfig> = {
  seed: {
    started: 'Adding demo data',
    startedDescription: "You'll receive a notification when the sample records are ready.",
    failed: 'Unable to add demo data',
    inFlight: 'Adding...',
  },
  delete: {
    started: 'Removing demo data',
    startedDescription: "You'll receive a notification when the sample records are removed.",
    failed: 'Unable to remove demo data',
    inFlight: 'Removing...',
  },
}

const JOB_FAILED_DESCRIPTION = 'Some sample records may be missing or left behind. Please try again later.'

const STATUS_UNAVAILABLE_REASON = "We couldn't check whether demo data is present. Please try again later."

type TPresenceState = 'absent' | 'partial' | 'present'

const ROW_COPY: Record<TPendingAction | TPresenceState, { title: string; description: string }> = {
  absent: { title: 'Explore with demo data', description: 'Add sample records to explore Openlane and remove them whenever you want.' },
  present: { title: 'Demo data added', description: "Remove the sample records added to your organization. Your own data won't be affected." },
  partial: { title: 'Some demo data remains', description: 'Some sample records are still in your organization. Remove them, or add the full set again.' },
  seed: { title: 'Adding demo data', description: "Sample records are being added to your organization. Feel free to navigate away, you'll receive a notification when they're ready." },
  delete: { title: 'Removing demo data', description: "Sample records are being removed from your organization. Feel free to navigate away, you'll receive a notification when it's done." },
}

const DemoData = () => {
  const hasFullAccess = useHasOrgFullAccess()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [pendingJob, setPendingJob] = useState<TDemoDataJob | null>(null)
  const [isRemoveOpen, setIsRemoveOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const hasScrolledRef = useRef(false)
  const isDispatchingRef = useRef(false)
  const pendingAction = pendingJob?.action

  const { data: presence, dataUpdatedAt, isPending, error } = useDemoDataPresence({ enabled: hasFullAccess, refetchInterval: pendingAction ? DEMO_DATA_POLL_INTERVAL_MS : false })
  const { mutateAsync: seedDemoData, isPending: isSeeding } = useSeedDemoData()
  const { mutateAsync: deleteDemoData, isPending: isDeleting } = useDeleteDemoData()

  useQueryErrorNotification({ error, description: 'Failed to load demo data status' })

  useDemoDataJobWatch({
    job: pendingJob,
    presence,
    presenceUpdatedAt: dataUpdatedAt,
    onFinish: (result) => {
      if (result === 'failed' && pendingJob) errorNotification({ title: ACTIONS[pendingJob.action].failed, description: JOB_FAILED_DESCRIPTION })
      setPendingJob(null)
      queryClient.invalidateQueries()
    },
  })

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

  const runJob = async (job: TDemoDataJob, dispatch: () => Promise<unknown>) => {
    if (isDispatchingRef.current || pendingJob) return
    isDispatchingRef.current = true
    const { started, startedDescription, failed } = ACTIONS[job.action]
    try {
      await dispatch()
      setPendingJob(job)
      setIsRemoveOpen(false)
      successNotification({ title: started, description: startedDescription })
    } catch (err) {
      errorNotification({ title: failed, description: parseErrorMessage(err) })
    } finally {
      isDispatchingRef.current = false
    }
  }

  const handleSeed = () => runJob(DEMO_DATA_SEED_JOB, () => seedDemoData({ input: { dataset: DEMO_DATASET } }))

  const handleRemove = (kept: ReadonlySet<TDemoDataTypeKey>) => {
    const keep = toKeptSchemas(kept)
    const removing = DEMO_DATA_TYPES.filter(({ key }) => !kept.has(key) && (presence?.counts[key] ?? 0) > 0).map(({ key }) => key)
    return runJob(createDemoDataDeleteJob(removing), () => deleteDemoData({ input: { dataset: DEMO_DATASET, ...(keep.length > 0 && { keep }) } }))
  }

  const presenceState: TPresenceState = presence?.hasAll ? 'present' : presence?.hasAny ? 'partial' : 'absent'
  const copy = ROW_COPY[pendingAction ?? presenceState]

  const renderAction = () => {
    if (pendingAction) {
      return (
        <Button variant="secondary" type="button" loading disabled>
          {ACTIONS[pendingAction].inFlight}
        </Button>
      )
    }

    const unavailableReason = presence ? null : STATUS_UNAVAILABLE_REASON

    return (
      <div className="flex flex-wrap gap-2">
        {presenceState !== 'present' && (
          <DisabledReasonTooltip reason={unavailableReason}>
            <Button variant={presenceState === 'partial' ? 'secondary' : 'primary'} type="button" disabled={isSeeding || isDeleting || !!unavailableReason} loading={isSeeding} onClick={handleSeed}>
              Add demo data
            </Button>
          </DisabledReasonTooltip>
        )}
        {presenceState !== 'absent' && (
          <Button variant="destructiveOutline" type="button" icon={<Trash2 />} iconPosition="left" disabled={isSeeding || isDeleting} loading={isDeleting} onClick={() => setIsRemoveOpen(true)}>
            Remove demo data
          </Button>
        )}
      </div>
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

      {presence && <RemoveDemoDataDialog counts={presence.counts} open={isRemoveOpen} onOpenChange={setIsRemoveOpen} onConfirm={handleRemove} isRemoving={isDeleting} />}
    </section>
  )
}

export { DemoData }
