import { EVIDENCE_EXTENSION_CONNECT_PATH, PERSONAL_ACCESS_TOKENS_PATH } from '@repo/evidence-capture/connect'

export const CONSOLE_ORIGIN = __OPENLANE_CONSOLE_ORIGIN__
export const API_GRAPHQL_URL = `${__OPENLANE_API_ORIGIN__}/query`

export const CONNECT_URL = `${CONSOLE_ORIGIN}${EVIDENCE_EXTENSION_CONNECT_PATH}`
export const PERSONAL_ACCESS_TOKENS_URL = `${CONSOLE_ORIGIN}${PERSONAL_ACCESS_TOKENS_PATH}`

export const evidenceConsoleUrl = (evidenceId: string) => `${CONSOLE_ORIGIN}/evidence?id=${encodeURIComponent(evidenceId)}`
