'use client'

import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { isCancelledError } from '@tanstack/react-query'
import Link from 'next/link'
import { defineStepper } from '@stepperize/react'
import { Button } from '@repo/ui/button'
import { Form } from '@repo/ui/form'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { StepHeader } from '@/components/shared/step-header/step-header'
import { useNotification } from '@/hooks/useNotification'
import { type TInternalPolicyDocument, useInternalPolicyDocumentsByIds } from '@/lib/graphql-hooks/internal-policy'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { formatTruncatedList, pluralizeWithCount } from '@/utils/strings'
import { AcknowledgementDetailsStep } from './acknowledgement-details-step'
import { AcknowledgementRecipientsStep } from './acknowledgement-recipients-step'
import { type TAcknowledgementRequestFormData, useAcknowledgementRequestFormSchema } from './use-acknowledgement-request-form-schema'
import { type TAcknowledgementRequestPhase, type TAcknowledgementRequestResult, useSendAcknowledgementRequest } from './use-send-acknowledgement-request'
import { type TDocumentPreparation, usePolicyDocumentPreparation } from './use-policy-document-preparation'

type TSendAcknowledgementRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPolicyIds?: string[]
}

type TDismissal = 'free' | 'guarded' | 'locked'

type TFormHandle = { abort: () => void }

type TFormProps = {
  initialPolicies: TInternalPolicyDocument[]
  onClose: () => void
  onDismissalChange: (dismissal: TDismissal) => void
  ref?: React.Ref<TFormHandle>
}

const { useStepper } = defineStepper([{ id: 'details' }, { id: 'recipients' }])

type TStepId = ReturnType<typeof useStepper>['current']['id']

type TSubmitPhase = 'preparing' | TAcknowledgementRequestPhase

const DETAIL_FIELDS = ['policies', 'name', 'statement'] as const satisfies (keyof TAcknowledgementRequestFormData)[]
const SEND_FIELDS = [...DETAIL_FIELDS, 'dueDate'] as const satisfies (keyof TAcknowledgementRequestFormData)[]
const NO_POLICY_IDS: string[] = []
const MAX_LISTED_FAILURES = 5

const STEP_DESCRIPTIONS = {
  details: 'Choose the policies to acknowledge and customize the acknowledgment statement. Save it for later or send it now.',
  recipients: 'Select recipients and optionally set a due date.',
}

const PHASE_LABELS: Record<TAcknowledgementRequestPhase, string> = {
  creating: 'Creating the acknowledgment request...',
  sending: 'Sending the acknowledgment request...',
}

const QuestionnaireLink = ({ assessmentId }: { assessmentId: string }) => (
  <Link href={getHrefForObjectType('assessments', { id: assessmentId })} className="text-blue-500 hover:underline">
    Open the questionnaire
  </Link>
)

type TPreparationStatusProps = {
  phase: TSubmitPhase | null
  preparation: TDocumentPreparation
  policyCount: number
  onRetry: () => void
}

const PreparationStatus = ({ phase, preparation, policyCount, onRetry }: TPreparationStatusProps) => {
  if (phase && phase !== 'preparing') return <StatusLine>{PHASE_LABELS[phase]}</StatusLine>
  if (preparation.status === 'preparing') {
    return (
      <StatusLine>
        Preparing policy PDFs ({preparation.exported} of {policyCount}). This can take up to a minute.
      </StatusLine>
    )
  }
  if (preparation.status === 'error') {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not prepare the policy PDFs: {parseErrorMessage(preparation.error)}{' '}
        <Button type="button" variant="link" className="text-blue-500" onClick={onRetry}>
          Retry
        </Button>
      </p>
    )
  }
  return null
}

const SendAcknowledgementRequestForm = ({ initialPolicies, onClose, onDismissalChange, ref }: TFormProps) => {
  const form = useAcknowledgementRequestFormSchema(initialPolicies)
  const stepper = useStepper()
  const [phase, setPhase] = useState<TSubmitPhase | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isSubmittingRef = useRef(false)
  const policies = form.watch('policies')
  const { preparation, prefetchDocuments, prepareDocuments } = usePolicyDocumentPreparation(policies)
  const sendRequest = useSendAcknowledgementRequest()
  const { successNotification, errorNotification } = useNotification()

  useImperativeHandle(ref, () => ({ abort: () => abortRef.current?.abort() }), [])
  useEffect(() => () => abortRef.current?.abort(), [])

  const isRecipientsStep = stepper.current.id === 'recipients'
  const isSubmitting = phase !== null
  const isLocked = phase === 'creating' || phase === 'sending'
  const hasWorkToLose = form.formState.isDirty || isRecipientsStep || isSubmitting

  useEffect(() => {
    onDismissalChange(isLocked ? 'locked' : hasWorkToLose ? 'guarded' : 'free')
  }, [hasWorkToLose, isLocked, onDismissalChange])

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
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    try {
      await validateAndSubmit(send)
    } finally {
      isSubmittingRef.current = false
    }
  }

  const validateAndSubmit = async (send: boolean) => {
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
    setPhase('preparing')
    try {
      const documents = await prepareDocuments()
      const result = await sendRequest(
        { documents, name: name.trim(), statement: statement.trim(), recipients: send ? recipients : [], dueDate: send ? dueDate : null },
        { signal: controller.signal, onPhase: setPhase },
      )
      notifyResult(result)
      onClose()
    } catch (error) {
      if (controller.signal.aborted || isCancelledError(error)) return
      errorNotification({ title: 'Could not create the acknowledgment request', description: parseErrorMessage(error) })
    } finally {
      setPhase(null)
    }
  }

  const goToRecipients = async () => {
    if (!(await form.trigger(DETAIL_FIELDS))) return
    prefetchDocuments()
    stepper.next()
  }

  const selectStep = (id: TStepId) => {
    if (isSubmitting || id === stepper.current.id) return
    if (id === 'recipients') void goToRecipients()
    else stepper.goTo(id)
  }

  return (
    <>
      <DialogDescription className="text-muted-foreground">{STEP_DESCRIPTIONS[stepper.current.id]}</DialogDescription>
      <StepHeader stepper={stepper} onStepSelect={selectStep} />
      <Form {...form}>
        <form className="min-w-0" onSubmit={(event) => event.preventDefault()}>
          {isRecipientsStep ? <AcknowledgementRecipientsStep form={form} /> : <AcknowledgementDetailsStep form={form} />}
        </form>
      </Form>
      <PreparationStatus phase={phase} preparation={preparation} policyCount={policies.length} onRetry={prefetchDocuments} />
      <DialogFooter className="sm:justify-between">
        {isRecipientsStep ? (
          <Button type="button" variant="secondary" onClick={() => stepper.prev()} disabled={isSubmitting}>
            Back
          </Button>
        ) : (
          <CancelButton onClick={onClose} disabled={isSubmitting && phase !== 'preparing'} />
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => void submit(false)} disabled={isSubmitting}>
            Save draft
          </Button>
          <Button type="button" variant="primary" onClick={() => void (isRecipientsStep ? submit(true) : goToRecipients())} disabled={isSubmitting} loading={isSubmitting}>
            {isRecipientsStep ? 'Create & send' : 'Send now'}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}

const SendAcknowledgementRequestContent = ({ initialPolicyIds, ...formProps }: Omit<TFormProps, 'initialPolicies'> & { initialPolicyIds: string[] }) => {
  const { policies, isPending, isPlaceholderData, isError } = useInternalPolicyDocumentsByIds(initialPolicyIds)
  const initialPolicies = useMemo(() => initialPolicyIds.flatMap((id) => policies.find((policy) => policy.id === id) ?? []), [initialPolicyIds, policies])
  const hasInitialPolicies = initialPolicyIds.length > 0

  if (hasInitialPolicies && isError) {
    return (
      <>
        <DialogDescription>The selected policies could not be loaded. Please try again later.</DialogDescription>
        <DialogFooter>
          <CancelButton onClick={formProps.onClose} title="Close" />
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

  return <SendAcknowledgementRequestForm initialPolicies={initialPolicies} {...formProps} />
}

export const SendAcknowledgementRequestDialog = ({ open, onOpenChange, initialPolicyIds = NO_POLICY_IDS }: TSendAcknowledgementRequestDialogProps) => {
  const [dismissal, setDismissal] = useState<TDismissal>('free')
  const formRef = useRef<TFormHandle>(null)

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      formRef.current?.abort()
      setDismissal('free')
    }
    onOpenChange(next)
  }

  const guardDismiss = (event: Event) => {
    if (dismissal !== 'free') event.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" showCloseButton={dismissal !== 'locked'} onInteractOutside={guardDismiss} onEscapeKeyDown={guardDismiss}>
        <DialogHeader>
          <DialogTitle>Send acknowledgment request</DialogTitle>
        </DialogHeader>
        <SendAcknowledgementRequestContent ref={formRef} initialPolicyIds={initialPolicyIds} onClose={() => handleOpenChange(false)} onDismissalChange={setDismissal} />
      </DialogContent>
    </Dialog>
  )
}
