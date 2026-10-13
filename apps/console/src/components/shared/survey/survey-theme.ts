import { type ITheme } from 'survey-core'

import 'survey-core/survey-core.min.css'
import 'survey-core/themes/adapters/shadcn-new-york.min.css'
import '@/styles/questionnaire/survey-theme.css'

export const createSurveyTheme = (): ITheme => ({
  themeName: 'openlane',
  isPanelless: true,
  cssVariables: {},
})
