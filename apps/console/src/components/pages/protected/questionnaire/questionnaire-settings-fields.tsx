import { useState } from 'react'
import type { AssessmentAssessmentType } from '@repo/codegen/src/schema'
import { CalendarPopover } from '@theopenlane/ui/calendar-popover'
import { Label } from '@theopenlane/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@theopenlane/ui/select'
import { ASSESSMENT_TYPE_OPTIONS, CUSTOM_DUE_DATE_DURATION, DURATION_OPTIONS, type TQuestionnaireEditorAction, type TQuestionnaireEditorState } from './questionnaire-editor-state'

type TQuestionnaireSettingsFieldsProps = {
  state: TQuestionnaireEditorState
  onSettingChange: (action: TQuestionnaireEditorAction) => void
}

export const QuestionnaireSettingsFields = ({ state, onSettingChange }: TQuestionnaireSettingsFieldsProps) => {
  const { assessmentType, responseDueDuration, isCustomDuration, customDueDate } = state
  const [calendarDisabledFrom] = useState(() => new Date())

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assessment-type">Type</Label>
        <Select value={assessmentType} onValueChange={(value) => onSettingChange({ type: 'set-assessment-type', value: value as AssessmentAssessmentType })}>
          <SelectTrigger id="assessment-type" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSESSMENT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="response-due">Response Due</Label>
        <div className="flex items-center gap-2">
          <Select
            value={String(isCustomDuration ? CUSTOM_DUE_DATE_DURATION : responseDueDuration)}
            onValueChange={(value) => {
              const duration = Number(value)
              onSettingChange(duration === CUSTOM_DUE_DATE_DURATION ? { type: 'enter-custom-duration' } : { type: 'select-duration-preset', value: duration })
            }}
          >
            <SelectTrigger id="response-due" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isCustomDuration && (
            <CalendarPopover
              defaultValue={customDueDate}
              disabledFrom={calendarDisabledFrom}
              buttonClassName="w-[200px] flex justify-between items-center"
              onChange={(date) => {
                if (date) {
                  onSettingChange({ type: 'set-custom-due-date', value: date })
                }
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}
