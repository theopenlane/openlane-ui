import { useEffect, useState } from 'react'
import type { SurveyCreator } from 'survey-creator-react'
import type { TabLogicPlugin } from 'survey-creator-core'

const JSON_EDITOR_TAB = 'json'
const LOGIC_TAB = 'logic'

export const commitPendingLogicEdits = (creator: SurveyCreator): Promise<boolean> =>
  new Promise((resolve) => {
    const logic = creator.activeTab === LOGIC_TAB ? creator.getPlugin<TabLogicPlugin>(LOGIC_TAB).model : undefined
    if (!logic) {
      resolve(true)
      return
    }
    logic.tryLeaveUI(resolve)
  })

export const useSurveyEditorSaveState = (creator: SurveyCreator) => {
  const [isModified, setIsModified] = useState(creator.state === 'modified')
  const [activeTab, setActiveTab] = useState(creator.activeTab)

  useEffect(() => {
    const syncState = () => setIsModified(creator.state === 'modified')
    const syncActiveTab = () => setActiveTab(creator.activeTab)

    creator.onStateChanged.add(syncState)
    creator.onActiveTabChanged.add(syncActiveTab)

    return () => {
      creator.onStateChanged.remove(syncState)
      creator.onActiveTabChanged.remove(syncActiveTab)
    }
  }, [creator])

  const isJsonEditorActive = activeTab === JSON_EDITOR_TAB
  const saveDisabledReason = isJsonEditorActive ? 'Leave the JSON Editor to apply your changes before saving' : !isModified ? 'No changes to save' : undefined

  return { isJsonEditorActive, saveDisabledReason }
}
