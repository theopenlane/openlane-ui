'use client'

import type { SurveyModel } from 'survey-core'
import { ReactElementFactory } from 'survey-react-ui'

const PROGRESS_TEXT_COMPONENT = 'ol-survey-progress-text'

type SurveyProgressTextProps = {
  survey: SurveyModel
}

const SurveyProgressText: React.FC<SurveyProgressTextProps> = ({ survey }) => <div className="ol-survey-progress-text">{survey.progressText}</div>

ReactElementFactory.Instance.registerElement(PROGRESS_TEXT_COMPONENT, (props: SurveyProgressTextProps) => <SurveyProgressText survey={props.survey} />)

export const attachSurveyProgressText = (survey: SurveyModel) => {
  if (!survey.showProgressBar || survey.progressBarType !== 'pages') {
    return
  }

  survey.addLayoutElement({
    id: PROGRESS_TEXT_COMPONENT,
    component: PROGRESS_TEXT_COMPONENT,
    container: 'center',
    index: 1000,
  })
}
