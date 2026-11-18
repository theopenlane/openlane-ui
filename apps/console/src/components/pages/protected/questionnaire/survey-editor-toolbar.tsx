import { useRef, type ReactNode } from 'react'
import type { SurveyCreator } from 'survey-creator-react'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SurveyTitleField } from './survey-title-field'
import { commitPendingLogicEdits, useSurveyEditorSaveState } from './use-survey-editor-save-state'

type TSurveyEditorToolbarProps = {
  creator: SurveyCreator
  titlePlaceholder: string
  onSave: () => Promise<void>
  isSaving: boolean
  children?: ReactNode
}

export const SurveyEditorToolbar = ({ creator, titlePlaceholder, onSave, isSaving, children }: TSurveyEditorToolbarProps) => {
  const { isJsonEditorActive, saveDisabledReason } = useSurveyEditorSaveState(creator)
  const isSaveInFlightRef = useRef(false)

  const handleSave = async () => {
    if (isSaveInFlightRef.current) return
    isSaveInFlightRef.current = true
    try {
      if (await commitPendingLogicEdits(creator)) await onSave()
    } finally {
      isSaveInFlightRef.current = false
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4 border-b px-4 py-3">
      <SurveyTitleField creator={creator} placeholder={titlePlaceholder} readOnly={isJsonEditorActive} />
      {children}
      <div className="ml-auto flex">
        <DisabledReasonTooltip reason={saveDisabledReason}>
          <SaveButton type="button" className="h-10 px-3" onClick={() => void handleSave()} loading={isSaving} isSaving={isSaving} disabled={isSaving || !!saveDisabledReason} />
        </DisabledReasonTooltip>
      </div>
    </div>
  )
}
