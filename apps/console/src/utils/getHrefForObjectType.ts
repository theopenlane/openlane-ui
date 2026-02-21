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

export const getHrefForObjectType = (kind: string, row?: NormalizedObject): string => {
  if (!row) return ''

  const controlId = row.control?.id ?? row.controlId

  switch (kind) {
    case 'policies':
      return `/policies/${row.id}/view`
    case 'procedures':
      return `/procedures/${row.id}/view`
    case 'standard controls':
      return `/standards/${row?.standardID}?controlId=${row.id}`
    case 'controls':
      return `/controls/${row.id}`
    case 'subcontrols':
      return `/controls/${controlId}/${row.id}`
    case 'risks':
      return `/risks/${row.id}`
    case 'tasks':
      return `/automation/tasks?id=${row.id}`
    case 'programs':
      return `/programs/${row.id}`
    case 'groups':
      return `/groups?id=${row.id}`
    case 'evidences':
      return `/evidence?id=${row.id}`
    case 'controlObjectives':
      return `/controls/${controlId}/control-objectives`
    default:
      return ''
  }
}

export const getHrefForSearchEntityType = (entityType: string, entityId: string, opts?: { subcontrolParentId?: string | null }): string => {
  switch (entityType) {
    case 'Control':
      return getHrefForObjectType('controls', { id: entityId })
    case 'Subcontrol':
      return opts?.subcontrolParentId ? getHrefForObjectType('subcontrols', { id: entityId, controlId: opts.subcontrolParentId }) : ''
    case 'InternalPolicy':
      return getHrefForObjectType('policies', { id: entityId })
    case 'Procedure':
      return getHrefForObjectType('procedures', { id: entityId })
    case 'Risk':
      return getHrefForObjectType('risks', { id: entityId })
    case 'Task':
      return getHrefForObjectType('tasks', { id: entityId })
    case 'Program':
      return getHrefForObjectType('programs', { id: entityId })
    case 'Group':
      return getHrefForObjectType('groups', { id: entityId })
    default:
      return ''
  }
}
