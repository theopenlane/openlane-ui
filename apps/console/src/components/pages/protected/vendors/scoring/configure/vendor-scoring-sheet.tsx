'use client'

import React, { useMemo, useRef, useState } from 'react'
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
  getDefaultQuestion,
  getRiskThresholdErrors,
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
import { BUILT_IN_LOCKS, DISCARD_COPY, EDITOR_COPY, FooterNote, type TDiscardTarget, type TQuestionEditor } from './vendor-scoring-sheet-parts'
import { VendorScoringQuestionsPanel, type TQuestionFilter } from './vendor-scoring-questions-panel'
import { VendorScoringScoringPanel } from './vendor-scoring-scoring-panel'
import { VENDOR_SCORING_QUESTION_FORM_ID, VendorScoringQuestionForm } from './vendor-scoring-question-form'
import { NEW_QUESTION_DEFAULTS, toQuestionFormData } from './use-vendor-scoring-question-form-schema'
import { useLinkUnconfiguredVendorRiskScores, useVendorRiskScoreQuestionUsage } from '@/lib/graphql-hooks/vendor-risk-score'

type TScoringTab = 'questions' | 'scoring'

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
  const [isEditorDirty, setIsEditorDirty] = useState(false)
  const [discardTarget, setDiscardTarget] = useState<TDiscardTarget | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<ReadonlySet<VendorRiskScoreVendorScoringCategory>>(() => initialCollapsedCategories(initialDraft))

  const isUnreadable = !loadFailed && parsedConfig === null
  const readOnly = loadFailed || !configId || !canConfigure || isUnreadable
  const thresholdErrors = useMemo(() => getRiskThresholdErrors(draft.maxScores), [draft.maxScores])
  const hasThresholdErrors = Object.keys(thresholdErrors).length > 0
  const enabledCount = draft.questions.filter((question) => question.enabled).length
  const editingQuestion = editor?.mode === 'edit' ? draft.questions.find((question) => question.draftId === editor.draftId) : undefined
  const editingDefault = editingQuestion && getDefaultQuestion(editingQuestion.key)
  const editingSavedCustomKey = editingQuestion && !editingDefault ? editingQuestion.key || undefined : undefined
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

  const closeEditor = () => {
    setEditor(null)
    setIsEditorDirty(false)
  }

  const requestCloseEditor = () => (isEditorDirty ? setDiscardTarget('editor') : closeEditor())

  const resetSession = () => {
    draftState.discard()
    closeEditor()
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
    if (isDirty || isEditorDirty) {
      setDiscardTarget('sheet')
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
      <FooterNote>{EDITOR_COPY[editor.mode].note}</FooterNote>
      <SlideoutFormActions formId={VENDOR_SCORING_QUESTION_FORM_ID} onCancel={requestCloseEditor} saveLabel={EDITOR_COPY[editor.mode].saveLabel} />
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
        initialWidth="70vw"
        minWidth={480}
        header={<SlideoutHeader title={editor ? EDITOR_COPY[editor.mode].title : 'Configure risk scoring'} onBack={editor ? requestCloseEditor : undefined} onClose={requestClose} />}
        footer={footer}
        aria-describedby="vendor-scoring-sheet-description"
      >
        <SheetDescription id="vendor-scoring-sheet-description" className="mb-4">
          Configure how vendors are assessed and assigned risk ratings
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  closeEditor()
                  draftState.discard()
                }}
              >
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
            defaultValues={editingQuestion ? toQuestionFormData(editingQuestion) : NEW_QUESTION_DEFAULTS}
            openlaneDefault={editingDefault}
            lockedReason={editingDefault ? BUILT_IN_LOCKS : { answerType: answerTypeLock }}
            onDirtyChange={setIsEditorDirty}
            onSubmit={(values) => {
              if (editor.mode === 'edit') draftState.updateQuestion(editor.draftId, answerTypeLock && editingQuestion ? { ...values, answerType: editingQuestion.answerType } : values)
              else draftState.addQuestion(values)
              closeEditor()
            }}
          />
        ) : (
          <Tabs value={tab} onValueChange={(value) => setTab(value === 'scoring' ? 'scoring' : 'questions')}>
            <TabsList className="mb-4">
              <TabsTrigger value="questions">
                Questions <CountBadge count={enabledCount} className="ml-1.5" />
              </TabsTrigger>
              <TabsTrigger value="scoring">Scoring & rating bands</TabsTrigger>
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
        open={discardTarget !== null}
        onOpenChange={(open) => !open && setDiscardTarget(null)}
        onConfirm={discardTarget === 'editor' ? closeEditor : close}
        title={DISCARD_COPY[discardTarget ?? 'sheet'].title}
        description={DISCARD_COPY[discardTarget ?? 'sheet'].description}
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
