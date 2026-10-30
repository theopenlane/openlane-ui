import { UserFacingError } from '@/utils/graphQlErrorMatcher'
import { type IntegrationSelectedResource, type TResourcePicker } from './types'

const GOOGLE_API_SCRIPT_URL = 'https://apis.google.com/js/api.js'
const GOOGLE_PICKER_LOAD_TIMEOUT_MS = 15_000 // 15s
const GOOGLE_DOCS_MIME_TYPE = 'application/vnd.google-apps.document'
const MY_DRIVE_FOLDER_ID = 'root'
const GOOGLE_PICKER_TITLE = 'Select documents'
const PICKER_LOAD_ERROR = 'The Google document picker could not be loaded. Please try again later.'

type TGooglePickerSession = {
  accessToken: string
  apiKey: string
  appId: string
}

let pickerApiPromise: Promise<void> | null = null
let closeActivePicker: (() => void) | null = null

const loadGoogleApiScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (typeof gapi !== 'undefined') {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_API_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new UserFacingError(PICKER_LOAD_ERROR))
    }
    document.head.appendChild(script)
  })

const loadPickerLibrary = (): Promise<void> =>
  new Promise((resolve, reject) => {
    gapi.load('picker', {
      callback: () => resolve(),
      onerror: () => reject(new UserFacingError(PICKER_LOAD_ERROR)),
      timeout: GOOGLE_PICKER_LOAD_TIMEOUT_MS,
      ontimeout: () => reject(new UserFacingError(PICKER_LOAD_ERROR)),
    })
  })

const loadGooglePickerApi = (): Promise<void> => {
  pickerApiPromise ??= loadGoogleApiScript()
    .then(loadPickerLibrary)
    .catch((error: unknown) => {
      pickerApiPromise = null
      throw error
    })

  return pickerApiPromise
}

const toSelectedResource = (document: google.picker.DocumentObject): IntegrationSelectedResource => ({
  id: document[google.picker.Document.ID],
  name: document[google.picker.Document.NAME],
  parentId: document[google.picker.Document.PARENT_ID],
})

const toGooglePickerSession = (session: Record<string, unknown>): TGooglePickerSession => {
  const { accessToken, apiKey, appId } = session
  if (typeof accessToken !== 'string' || !accessToken || typeof apiKey !== 'string' || !apiKey || typeof appId !== 'string' || !appId) {
    throw new UserFacingError('The Google document picker is not configured for this installation. Please try again later.')
  }

  return { accessToken, apiKey, appId }
}

const googleDocsView = (): google.picker.DocsView => new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(GOOGLE_DOCS_MIME_TYPE).setIncludeFolders(true)

const pickGoogleDocuments = async (details: Record<string, unknown>): Promise<IntegrationSelectedResource[]> => {
  const session = toGooglePickerSession(details)
  await loadGooglePickerApi()

  return new Promise((resolve, reject) => {
    const myDrive = googleDocsView()
    myDrive.setParent(MY_DRIVE_FOLDER_ID)

    const picker = new google.picker.PickerBuilder()
      .addView(myDrive)
      .addView(googleDocsView().setOwnedByMe(false))
      .addView(googleDocsView().setEnableDrives(true))
      .setTitle(GOOGLE_PICKER_TITLE)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .enableFeature(google.picker.Feature.SUPPORT_DRIVES)
      .setOAuthToken(session.accessToken)
      .setDeveloperKey(session.apiKey)
      .setAppId(session.appId)
      .setCallback((response) => {
        const action = response[google.picker.Response.ACTION]
        if (action !== google.picker.Action.PICKED && action !== google.picker.Action.CANCEL && action !== google.picker.Action.ERROR) {
          return
        }

        picker.dispose()
        closeActivePicker = null
        if (action === google.picker.Action.ERROR) {
          reject(new UserFacingError('Google could not open your documents. Please try again later.'))
          return
        }

        resolve((response[google.picker.Response.DOCUMENTS] ?? []).map(toSelectedResource))
      })
      .build()

    closeActivePicker = () => {
      picker.dispose()
      closeActivePicker = null
      resolve([])
    }
    picker.setVisible(true)
  })
}

export const googleDocumentsPicker: TResourcePicker = {
  preload: loadGooglePickerApi,
  pick: pickGoogleDocuments,
  cancel: () => closeActivePicker?.(),
}
