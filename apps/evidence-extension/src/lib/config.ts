import { CONNECTED_APPS_PATH, EVIDENCE_EXTENSION_CONNECT_PATH } from '@repo/evidence-capture/connect'

export const CONSOLE_ORIGIN = __OPENLANE_CONSOLE_ORIGIN__
export const API_ORIGIN = __OPENLANE_API_ORIGIN__
export const API_GRAPHQL_URL = `${API_ORIGIN}/query`

export const CONNECT_URL = `${CONSOLE_ORIGIN}${EVIDENCE_EXTENSION_CONNECT_PATH}`
export const CONNECTED_APPS_URL = `${CONSOLE_ORIGIN}${CONNECTED_APPS_PATH}`

export const evidenceConsoleUrl = (evidenceId: string) => `${CONSOLE_ORIGIN}/evidence?id=${encodeURIComponent(evidenceId)}`
