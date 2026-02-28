import { pluralizeTypeName } from './strings'

export type NormalizedObject = {
  id: string
  refCode?: string
  displayID?: string
  controlId?: string
  name?: string
  title?: string
  description?: string
  summary?: string
  details?: string
  standardID?: string | null
  control?: {
    // for subcontrols
    id?: string
  }
}

const SIMPLE_ROUTES: Record<string, (id: string) => string> = {
  policies: (id) => `/policies/${id}/view`,
  procedures: (id) => `/procedures/${id}/view`,
  controls: (id) => `/controls/${id}`,
  risks: (id) => `/risks/${id}`,
  tasks: (id) => `/automation/tasks?id=${id}`,
  programs: (id) => `/programs/${id}`,
  groups: (id) => `/groups?id=${id}`,
  evidences: (id) => `/evidence?id=${id}`,
  assets: (id) => `/registry/assets?id=${id}`,
  entities: (id) => `/registry/vendors?id=${id}`,
  identityHolders: (id) => `/registry/personnel?id=${id}`,
  scans: (id) => `/exposure/scans?id=${id}`,
  campaigns: (id) => `/automation/campaigns?id=${id}`,
}

export const getHrefForObjectType = (kind: string, row?: NormalizedObject): string => {
  if (!row) return ''

  const simpleRoute = SIMPLE_ROUTES[kind]
  if (simpleRoute) return simpleRoute(row.id)

  const controlId = row.control?.id ?? row.controlId

  switch (kind) {
    case 'standard controls':
      return `/standards/${row.standardID}?controlId=${row.id}`
    case 'subcontrols':
      return `/controls/${controlId}/${row.id}`
    case 'controlObjectives':
      return `/controls/${controlId}/control-objectives`
    default:
      return ''
  }
}

export const getHrefForSearchEntityType = (
  entityType: string,
  entityId: string,
  opts?: {
    subcontrolParentId?: string | null
    controlOwnerID?: string | null
    controlStandardID?: string | null
  },
): string => {
  switch (entityType) {
    case 'Control':
      if (!opts?.controlOwnerID && opts?.controlStandardID) {
        return getHrefForObjectType('standard controls', { id: entityId, standardID: opts.controlStandardID })
      }
      return getHrefForObjectType('controls', { id: entityId })
    case 'Subcontrol':
      return opts?.subcontrolParentId ? getHrefForObjectType('subcontrols', { id: entityId, controlId: opts.subcontrolParentId }) : ''
    case 'InternalPolicy':
      return getHrefForObjectType('policies', { id: entityId })
    case 'Standard':
      return `/standards/${entityId}`
    case 'Template':
      return `/questionnaires/templates/template-viewer?id=${entityId}`
    default:
      return getHrefForObjectType(pluralizeTypeName(entityType), { id: entityId })
  }
}
