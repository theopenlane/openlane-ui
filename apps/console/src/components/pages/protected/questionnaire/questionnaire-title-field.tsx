import { useCallback, useId, useSyncExternalStore } from 'react'
import type { SurveyCreator } from 'survey-creator-react'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { UNTITLED_QUESTIONNAIRE } from './questionnaire-editor-state'

type TQuestionnaireTitleFieldProps = {
  creator: SurveyCreator
  onTitleChange: (title: string) => void
}

export const QuestionnaireTitleField = ({ creator, onTitleChange }: TQuestionnaireTitleFieldProps) => {
  const titleId = useId()

  const subscribe = useCallback(
    (notify: () => void) => {
      creator.onModified.add(notify)
      creator.registerPropertyChangedHandlers(['surveyValue'], notify, titleId)

      return () => {
        creator.onModified.remove(notify)
        creator.unregisterPropertyChangedHandlers(['surveyValue'], titleId)
      }
    },
    [creator, titleId],
  )

  const title = useSyncExternalStore(subscribe, () => creator.survey.title ?? '')

  return (
    <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
      <Label htmlFor={titleId}>Title</Label>
      <Input id={titleId} value={title} placeholder={UNTITLED_QUESTIONNAIRE} onChange={(event) => onTitleChange(event.target.value)} />
    </div>
  )
}
