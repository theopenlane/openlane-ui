import { type Connection, getNodes } from '@/lib/graphql-hooks/connection'
import { compareNatural } from '@/lib/sort'

export const CONTROL_IMPLEMENTATIONS_HREF = '/control-implementations'

export const controlImplementationHref = (id: string): string => `${CONTROL_IMPLEMENTATIONS_HREF}/${id}`

type TRefCodeConnection = Pick<Connection<{ refCode?: string | null }>, 'edges'> | null

type TControlImplementationTitleSource = {
  controls?: TRefCodeConnection
  subcontrols?: TRefCodeConnection
}

const firstRefCode = (connection?: TRefCodeConnection): string | undefined =>
  getNodes(connection)
    .flatMap(({ refCode }) => refCode?.trim() || [])
    .sort(compareNatural)[0]

export const sortByRefCode = <T extends { refCode: string }>(connection: Pick<Connection<T>, 'edges'>): { node: T }[] =>
  getNodes(connection)
    .sort((a, b) => compareNatural(a.refCode, b.refCode))
    .map((node) => ({ node }))

export const getControlImplementationTitle = (implementation?: TControlImplementationTitleSource | null): string => {
  const refCode = firstRefCode(implementation?.controls) ?? firstRefCode(implementation?.subcontrols)
  return refCode ? `${refCode} Implementation` : 'Control Implementation'
}

export const toParentControlIDs = (controlId: string, subcontrolId?: string | null): { controlIDs: string[] } | { subcontrolIDs: string[] } =>
  subcontrolId ? { subcontrolIDs: [subcontrolId] } : { controlIDs: [controlId] }

export const getVerifiedLabel = (verified?: boolean | null): string => (verified ? 'Verified' : 'Not verified')
