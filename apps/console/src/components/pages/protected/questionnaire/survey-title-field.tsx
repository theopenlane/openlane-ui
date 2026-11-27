import { useCallback, useId, useSyncExternalStore } from 'react'
import type { SurveyCreator } from 'survey-creator-react'
import { Input } from '@theopenlane/ui/input'
import { Label } from '@theopenlane/ui/label'

export const surveyTitleOr = (creator: SurveyCreator, fallback: string): string => creator.survey.title?.trim() || fallback

type TSurveyTitleFieldProps = {
  creator: SurveyCreator
  placeholder: string
  readOnly?: boolean
}

export const SurveyTitleField = ({ creator, placeholder, readOnly }: TSurveyTitleFieldProps) => {
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
      <Input id={titleId} value={title} placeholder={placeholder} readOnly={readOnly} onChange={(event) => creator.survey.setLocalizableStringText('title', event.target.value)} />
    </div>
  )
}
