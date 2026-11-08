'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription } from '@repo/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Callout } from '@/components/shared/callout/callout'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { useOrganizationVendorScoringConfig, useUpdateVendorScoringConfig } from '@/lib/graphql-hooks/vendor-scoring-config'
import {
  createVendorScoringDraft,
  EMPTY_PARSED_VENDOR_SCORING_CONFIG,
  getRiskThresholdErrors,
  questionOrigin,
  type TParsedVendorScoringConfig,
  type TVendorScoringDraft,
} from '@/lib/vendor-scoring-config'
import { type VendorRiskScoreVendorScoringCategory, VendorScoringConfigVendorScoringMode } from '@repo/codegen/src/schema'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useVendorScoringDisplay } from '../use-vendor-scoring-display'
import { useSetUpVendorScoring, useVendorScoringAccess } from '../use-vendor-scoring-access'
import { useVendorScoringDraft } from './use-vendor-scoring-draft'
import { VendorScoringQuestionsPanel, type TQuestionFilter } from './vendor-scoring-questions-panel'
import { VendorScoringScoringPanel } from './vendor-scoring-scoring-panel'
import { VENDOR_SCORING_QUESTION_FORM_ID, VendorScoringQuestionForm } from './vendor-scoring-question-form'
import { NEW_QUESTION_DEFAULTS, toQuestionFormData } from './use-vendor-scoring-question-form-schema'
import { useLinkUnconfiguredVendorRiskScores, useVendorRiskScoreQuestionUsage } from '@/lib/graphql-hooks/vendor-risk-score'

type TScoringTab = 'questions' | 'scoring'

type TQuestionEditor = { mode: 'add' } | { mode: 'edit'; draftId: string }

const FooterNote = ({ children }: { children: React.ReactNode }) => (
  <p className="mr-auto flex items-center gap-1.5 text-xs text-warning">
    <Info size={14} className="shrink-0" />
    {children}
  </p>
)

const initialCollapsedCategories = (draft: TVendorScoringDraft) => new Set(draft.questions.map((question) => question.category).filter((category) => category !== draft.questions[0]?.category))

type TVendorScoringEditorProps = {
  loadFailed: boolean
  configId: string | undefined
  parsedConfig: TParsedVendorScoringConfig | null
  scoringMode: VendorScoringConfigVendorScoringMode | null | undefined
}

const VendorScoringEditor: React.FC<TVendorScoringEditorProps> = ({ loadFailed, configId, parsedConfig, scoringMode }) => {
  const { isConfigurationOpen, closeConfiguration } = useVendorScoringDisplay()
  const { canConfigure, disabledReason } = useVendorScoringAccess()
  const { setUp, isSettingUp, canSetUp } = useSetUpVendorScoring()
  const { mutateAsync: updateConfig } = useUpdateVendorScoringConfig()
  const linkUnconfiguredScores = useLinkUnconfiguredVendorRiskScores()
  const [isSaving, setIsSaving] = useState(false)
  const saveInFlightRef = useRef(false)
  const { successNotification, errorNotification } = useNotification()

  const initialDraft = useMemo(() => createVendorScoringDraft(scoringMode, parsedConfig ?? EMPTY_PARSED_VENDOR_SCORING_CONFIG), [scoringMode, parsedConfig])
  const draftState = useVendorScoringDraft(initialDraft)
  const { draft, changes, isDirty, hasNewerVersion } = draftState

  const [tab, setTab] = useState<TScoringTab>('questions')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<TQuestionFilter>('all')
  const [editor, setEditor] = useState<TQuestionEditor | null>(null)
  const [isDiscardOpen, setIsDiscardOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<ReadonlySet<VendorRiskScoreVendorScoringCategory>>(() => initialCollapsedCategories(initialDraft))

  const isUnreadable = !loadFailed && parsedConfig === null
  const readOnly = loadFailed || !configId || !canConfigure || isUnreadable
  const thresholdErrors = useMemo(() => getRiskThresholdErrors(draft.maxScores), [draft.maxScores])
  const hasThresholdErrors = Object.keys(thresholdErrors).length > 0
  const enabledCount = draft.questions.filter((question) => question.enabled).length
  const editingQuestion = editor?.mode === 'edit' ? draft.questions.find((question) => question.draftId === editor.draftId) : undefined
  const editingOrigin = editingQuestion && questionOrigin(editingQuestion)
  const editingSavedCustomKey = editingOrigin === 'custom' ? editingQuestion?.key || undefined : undefined
  const editingUsage = useVendorRiskScoreQuestionUsage(editingSavedCustomKey)
  const answerTypeLock = !editingSavedCustomKey
    ? undefined
    : editingUsage.isPending
      ? 'Checking whether vendors have answered this question…'
      : editingUsage.isError
        ? 'Could not check whether vendors have answered this question, so its answer type cannot change.'
        : editingUsage.answerCount
          ? 'This question is already used in vendor scores, so its answer type cannot change.'
          : undefined

  const resetSession = () => {
    draftState.discard()
    setEditor(null)
    setTab('questions')
    setSearch('')
    setFilter('all')
    setCollapsedCategories(initialCollapsedCategories(initialDraft))
  }

  const close = () => {
    resetSession()
    closeConfiguration()
  }

  const requestClose = () => {
    if (isSaving) return
    if (isDirty || editor) {
      setIsDiscardOpen(true)
      return
    }
    close()
  }

  const rescoreNote = changes.scoringMode !== undefined || changes.riskThresholds !== undefined

  const handleSave = async () => {
    if (!configId || !isDirty || hasThresholdErrors || saveInFlightRef.current) return
    saveInFlightRef.current = true
    setIsSaving(true)
    try {
      if (rescoreNote) await linkUnconfiguredScores(configId)
      await updateConfig({ updateVendorScoringConfigId: configId, input: changes })
      successNotification({
        title: 'Vendor scoring updated',
        description: rescoreNote ? 'Vendor ratings are being recalculated and will refresh shortly.' : undefined,
      })
      close()
    } catch (error) {
      errorNotification({ title: 'Could not save vendor scoring', description: parseErrorMessage(error) })
    } finally {
      saveInFlightRef.current = false
      setIsSaving(false)
    }
  }

  const questionsNote =
    changes.questions === undefined
      ? undefined
      : draft.scoringMode === VendorScoringConfigVendorScoringMode.FULL_QUESTIONNAIRE
        ? 'Vendor scores pick up question changes the next time one of their answers changes.'
        : 'Question changes apply to answers recorded from now on.'
  const saveDisabledReason = hasThresholdErrors ? 'Fix the rating bands before saving.' : !isDirty ? 'No changes to save.' : undefined

  const footer = editor ? (
    <>
      <FooterNote>{editor.mode === 'add' ? 'New questions apply to future answers.' : 'Changes apply to answers recorded from now on.'}</FooterNote>
      <SlideoutFormActions formId={VENDOR_SCORING_QUESTION_FORM_ID} onCancel={() => setEditor(null)} saveLabel={editor.mode === 'add' ? 'Add question' : 'Save question'} />
    </>
  ) : readOnly ? (
    <Button type="button" variant="secondary" onClick={close}>
      Close
    </Button>
  ) : (
    <>
      {rescoreNote ? <FooterNote>Saving rescores every scored vendor.</FooterNote> : questionsNote && <FooterNote>{questionsNote}</FooterNote>}
      <CancelButton onClick={requestClose} disabled={isSaving} />
      <DisabledReasonTooltip reason={isSaving ? undefined : saveDisabledReason}>
        <SaveButton type="button" onClick={handleSave} disabled={!!saveDisabledReason || isSaving} isSaving={isSaving} title="Save changes" />
      </DisabledReasonTooltip>
    </>
  )

  return (
    <Sheet open={isConfigurationOpen} onOpenChange={(open) => !open && requestClose()}>
      <SheetContent
        initialWidth={720}
        minWidth={480}
        header={<SlideoutHeader title="Configure risk scoring" onClose={requestClose} />}
        footer={footer}
        aria-describedby="vendor-scoring-sheet-description"
      >
        <SheetDescription id="vendor-scoring-sheet-description" className="mb-4">
          The questions and rating rules used to score every vendor.
        </SheetDescription>

        {loadFailed && (
          <Callout variant="danger" className="mb-4" title="Vendor scoring could not be loaded">
            Please try again later. Editing is turned off until your organization&apos;s scoring settings load.
          </Callout>
        )}

        {hasNewerVersion && (
          <Callout
            variant="warning"
            className="mb-4"
            title="Someone else changed vendor scoring"
            action={
              <Button type="button" variant="secondary" onClick={draftState.discard}>
                Load their changes
              </Button>
            }
          >
            Saving now would overwrite their changes. Load them to start again from the latest version.
          </Callout>
        )}

        {isUnreadable && (
          <Callout variant="danger" className="mb-4" title="This scoring configuration could not be read">
            It contains values this version of the console does not recognize, so editing is turned off to avoid overwriting them.
          </Callout>
        )}

        {!loadFailed && !configId && (
          <Callout
            variant="info"
            className="mb-4"
            title="Vendor scoring is using Openlane defaults"
            action={
              <DisabledReasonTooltip reason={canConfigure ? undefined : disabledReason}>
                <Button type="button" onClick={setUp} disabled={!canConfigure || !canSetUp || isSettingUp} loading={isSettingUp}>
                  Set up vendor scoring
                </Button>
              </DisabledReasonTooltip>
            }
          >
            These are the questions and bands every vendor is scored against today. Set up scoring to change them for your organization.
          </Callout>
        )}

        {configId && !canConfigure && !isUnreadable && (
          <Callout variant="plain" className="mb-4">
            {disabledReason}
          </Callout>
        )}

        {editor ? (
          <VendorScoringQuestionForm
            key={editor.mode === 'edit' ? editor.draftId : 'new'}
            title={editor.mode === 'add' ? 'Add a question' : 'Edit question'}
            defaultValues={editingQuestion ? toQuestionFormData(editingQuestion) : NEW_QUESTION_DEFAULTS}
            lockedReason={
              editingOrigin && editingOrigin !== 'custom'
                ? { category: 'Openlane questions keep their category.', answerType: 'Openlane questions keep their answer type.' }
                : { answerType: answerTypeLock }
            }
            onBack={() => setEditor(null)}
            onSubmit={(values) => {
              if (editor.mode === 'edit') draftState.updateQuestion(editor.draftId, answerTypeLock && editingQuestion ? { ...values, answerType: editingQuestion.answerType } : values)
              else draftState.addQuestion(values)
              setEditor(null)
            }}
          />
        ) : (
          <Tabs value={tab} onValueChange={(value) => setTab(value === 'scoring' ? 'scoring' : 'questions')}>
            <TabsList className="mb-4">
              <TabsTrigger value="questions">
                Questions <CountBadge count={enabledCount} label="on" className="ml-1.5 py-0" />
              </TabsTrigger>
              <TabsTrigger value="scoring">Scoring and rating bands</TabsTrigger>
            </TabsList>
            <TabsContent value="questions">
              <VendorScoringQuestionsPanel
                questions={draft.questions}
                readOnly={readOnly}
                search={search}
                onSearchChange={setSearch}
                filter={filter}
                onFilterChange={setFilter}
                collapsedCategories={collapsedCategories}
                onCollapsedCategoriesChange={setCollapsedCategories}
                onAdd={() => setEditor({ mode: 'add' })}
                onToggle={draftState.setQuestionEnabled}
                onEdit={(draftId) => setEditor({ mode: 'edit', draftId })}
                onReset={draftState.resetQuestion}
                onRemove={draftState.removeQuestion}
              />
            </TabsContent>
            <TabsContent value="scoring">
              <VendorScoringScoringPanel
                draft={draft}
                readOnly={readOnly}
                thresholdErrors={thresholdErrors}
                onScoringModeChange={draftState.setScoringMode}
                onMaxScoreChange={draftState.setMaxScore}
                onResetMaxScores={draftState.resetMaxScores}
              />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>

      <ConfirmationDialog
        open={isDiscardOpen}
        onOpenChange={setIsDiscardOpen}
        onConfirm={close}
        title="Discard your changes?"
        description="Your scoring changes have not been saved."
        confirmationText="Discard changes"
      />
    </Sheet>
  )
}

export const VendorScoringSheet = () => {
  const { config, parsedConfig, isPending, isResolved } = useOrganizationVendorScoringConfig()

  if (isPending) return null

  return <VendorScoringEditor key={config?.id ?? 'defaults'} loadFailed={!isResolved} configId={config?.id} parsedConfig={parsedConfig} scoringMode={config?.scoringMode} />
}
