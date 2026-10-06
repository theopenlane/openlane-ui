'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { defineStepper } from '@stepperize/react'
import { Button } from '@repo/ui/button'
import { Form } from '@repo/ui/form'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { useNotification } from '@/hooks/useNotification'
import { type TInternalPolicyDocument, useInternalPolicyDocumentsByIds } from '@/lib/graphql-hooks/internal-policy'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { formatTruncatedList, pluralizeWithCount } from '@/utils/strings'
import { AcknowledgementDetailsStep } from './acknowledgement-details-step'
import { AcknowledgementRecipientsStep } from './acknowledgement-recipients-step'
import { type TAcknowledgementRequestFormData, useAcknowledgementRequestFormSchema } from './use-acknowledgement-request-form-schema'
import { type TAcknowledgementRequestProgress, type TAcknowledgementRequestResult, useSendAcknowledgementRequest } from './use-send-acknowledgement-request'

type TSendAcknowledgementRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPolicyIds?: string[]
}

type TFormProps = {
  initialPolicies: TInternalPolicyDocument[]
  onClose: () => void
  onLockChange: (locked: boolean) => void
}

const { useStepper } = defineStepper([{ id: 'details' }, { id: 'recipients' }])

const DETAIL_FIELDS = ['policies', 'name', 'statement'] as const satisfies (keyof TAcknowledgementRequestFormData)[]
const SEND_FIELDS = [...DETAIL_FIELDS, 'dueDate'] as const satisfies (keyof TAcknowledgementRequestFormData)[]
const NO_POLICY_IDS: string[] = []
const MAX_LISTED_FAILURES = 5

const STEP_DESCRIPTIONS = {
  details: 'Create an assessment linked to one or more policies. Save it now or send it to recipients immediately.',
  recipients: 'Select recipients and choose when this acknowledgment request is due.',
}

const progressLabel = (progress: TAcknowledgementRequestProgress, total: number) => {
  if (progress.phase === 'exporting') return `Exporting policies to PDF (${progress.exported} of ${total}). This can take up to a minute.`
  if (progress.phase === 'creating') return 'Creating the acknowledgment request...'
  return 'Sending the acknowledgment request...'
}

const QuestionnaireLink = ({ assessmentId }: { assessmentId: string }) => (
  <Link href={getHrefForObjectType('assessments', { id: assessmentId })} className="text-blue-500 hover:underline">
    Open the questionnaire
  </Link>
)

const SendAcknowledgementRequestForm = ({ initialPolicies, onClose, onLockChange }: TFormProps) => {
  const form = useAcknowledgementRequestFormSchema(initialPolicies)
  const stepper = useStepper()
  const [progress, setProgress] = useState<TAcknowledgementRequestProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sendRequest = useSendAcknowledgementRequest()
  const { successNotification, errorNotification } = useNotification()

  useEffect(() => () => abortRef.current?.abort(), [])

  const policies = form.watch('policies')
  const isSubmitting = progress !== null
  const isCancellable = progress === null || progress.phase === 'exporting'
  const isRecipientsStep = stepper.current.id === 'recipients'

  const updateProgress = (next: TAcknowledgementRequestProgress | null) => {
    setProgress(next)
    onLockChange(next !== null && next.phase !== 'exporting')
  }

  const notifyResult = ({ assessmentId, sendResult }: TAcknowledgementRequestResult) => {
    const link = <QuestionnaireLink assessmentId={assessmentId} />
    if (!sendResult) {
      successNotification({ title: 'Acknowledgment request saved', description: link })
      return
    }
    const { sent, failed } = sendResult
    successNotification({
      title: sent.length > 0 ? `Acknowledgment request sent to ${pluralizeWithCount(sent.length, 'recipient')}` : 'Acknowledgment request created',
      description: link,
    })
    if (failed.length > 0) {
      const failures = failed.map(({ email, reason }) => `${email} (${reason})`)
      errorNotification({
        title: `Could not send to ${pluralizeWithCount(failed.length, 'recipient')}`,
        description: `${formatTruncatedList(failures, failures.length, MAX_LISTED_FAILURES)}. The request was created, so you can send it to them again from the questionnaire.`,
      })
    }
  }

  const submit = async (send: boolean) => {
    if (!(await form.trigger(send ? SEND_FIELDS : DETAIL_FIELDS))) {
      if (!(await form.trigger(DETAIL_FIELDS))) stepper.goTo('details')
      return
    }
    const { name, statement, recipients, dueDate } = form.getValues()
    if (send && recipients.length === 0) {
      form.setError('recipients', { message: 'Add at least one recipient to send this request.' })
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    try {
      const result = await sendRequest(
        { policies, name: name.trim(), statement: statement.trim(), recipients: send ? recipients : [], dueDate: send ? dueDate : null },
        { signal: controller.signal, onProgress: updateProgress },
      )
      updateProgress(null)
      notifyResult(result)
      onClose()
    } catch (error) {
      updateProgress(null)
      if (controller.signal.aborted) return
      errorNotification({ title: 'Could not create the acknowledgment request', description: parseErrorMessage(error) })
    }
  }

  const goToRecipients = async () => {
    if (await form.trigger(DETAIL_FIELDS)) stepper.next()
  }

  return (
    <>
      <DialogDescription>{STEP_DESCRIPTIONS[stepper.current.id]}</DialogDescription>
      <StepHeader stepper={stepper} />
      <Form {...form}>
        <form className="min-w-0" onSubmit={(event) => event.preventDefault()}>
          {isRecipientsStep ? <AcknowledgementRecipientsStep form={form} /> : <AcknowledgementDetailsStep form={form} />}
        </form>
      </Form>
      {progress && (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" />
          {progressLabel(progress, policies.length)}
        </p>
      )}
      <DialogFooter className="sm:justify-between">
        {isRecipientsStep ? (
          <Button type="button" variant="secondary" onClick={() => stepper.prev()} disabled={isSubmitting}>
            Back
          </Button>
        ) : (
          <CancelButton onClick={onClose} disabled={!isCancellable} />
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => void submit(false)} disabled={isSubmitting}>
            {isRecipientsStep ? 'Save instead' : 'Save'}
          </Button>
          <Button type="button" variant="primary" onClick={() => void (isRecipientsStep ? submit(true) : goToRecipients())} disabled={isSubmitting} loading={isSubmitting}>
            {isRecipientsStep ? 'Create & send' : 'Send now'}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

const SendAcknowledgementRequestContent = ({ initialPolicyIds, onClose, onLockChange }: Omit<TFormProps, 'initialPolicies'> & { initialPolicyIds: string[] }) => {
  const { policies, isPending, isPlaceholderData, isError } = useInternalPolicyDocumentsByIds(initialPolicyIds)
  const initialPolicies = useMemo(() => initialPolicyIds.flatMap((id) => policies.find((policy) => policy.id === id) ?? []), [initialPolicyIds, policies])
  const hasInitialPolicies = initialPolicyIds.length > 0

  if (hasInitialPolicies && isError) {
    return (
      <>
        <DialogDescription>The selected policies could not be loaded. Please try again later.</DialogDescription>
        <DialogFooter>
          <CancelButton onClick={onClose} title="Close" />
        </DialogFooter>
      </>
    )
  }

  if (hasInitialPolicies && (isPending || isPlaceholderData)) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-live="polite" aria-label="Loading policies">
        <DialogDescription className="sr-only">Loading the selected policies.</DialogDescription>
        <Skeleton height={16} className="w-full max-w-[480px] rounded-md" />
        <Skeleton height={40} className="w-full rounded-md" />
        <Skeleton height={40} className="w-full rounded-md" />
        <Skeleton height={80} className="w-full rounded-md" />
      </div>
    )
  }

  return <SendAcknowledgementRequestForm initialPolicies={initialPolicies} onClose={onClose} onLockChange={onLockChange} />
}

export const SendAcknowledgementRequestDialog = ({ open, onOpenChange, initialPolicyIds = NO_POLICY_IDS }: TSendAcknowledgementRequestDialogProps) => {
  const [isLocked, setIsLocked] = useState(false)

  const close = () => {
    setIsLocked(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next || !isLocked) && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" showCloseButton={!isLocked}>
        <DialogHeader>
          <DialogTitle>Send acknowledgment request</DialogTitle>
        </DialogHeader>
        <SendAcknowledgementRequestContent initialPolicyIds={initialPolicyIds} onClose={close} onLockChange={setIsLocked} />
      </DialogContent>
    </Dialog>
  )
}
