import { type Connection, getNodes } from '@/lib/graphql-hooks/connection'
import { compareNatural } from '@/lib/sort'

export const CONTROL_IMPLEMENTATIONS_HREF = '/control-implementations'

export const controlImplementationHref = (id: string): string => `${CONTROL_IMPLEMENTATIONS_HREF}/${id}`

type TRefCodeConnection = Pick<Connection<{ refCode?: string | null; referenceFramework?: string | null }>, 'edges'> | null

type TControlImplementationTitleSource = {
  controls?: TRefCodeConnection
  subcontrols?: TRefCodeConnection
}

const firstControlLabel = (connection?: TRefCodeConnection): string | undefined => {
  const [first] = getNodes(connection)
    .flatMap(({ refCode, referenceFramework }) => (refCode?.trim() ? [{ refCode: refCode.trim(), framework: referenceFramework?.trim() ?? '' }] : []))
    .sort((a, b) => compareNatural(a.refCode, b.refCode) || compareNatural(a.framework, b.framework))

  return first && [first.framework, first.refCode].filter(Boolean).join(' ')
}

export const sortByRefCode = <T extends { refCode: string }>(connection: Pick<Connection<T>, 'edges'>): { node: T }[] =>
  getNodes(connection)
    .sort((a, b) => compareNatural(a.refCode, b.refCode))
    .map((node) => ({ node }))

export const getControlImplementationTitle = (implementation?: TControlImplementationTitleSource | null): string => {
  const label = firstControlLabel(implementation?.controls) ?? firstControlLabel(implementation?.subcontrols)
  return label ? `${label} Implementation` : 'Control Implementation'
}

export const toParentControlIDs = (controlId: string, subcontrolId?: string | null): { controlIDs: string[] } | { subcontrolIDs: string[] } =>
  subcontrolId ? { subcontrolIDs: [subcontrolId] } : { controlIDs: [controlId] }

export const getVerifiedLabel = (verified?: boolean | null): string => (verified ? 'Verified' : 'Not verified')
