export type NormalizedObject = {
  id: string
  refCode?: string
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
      return `/controls/${row.control?.id ?? row.controlId}/${row.id}`
    case 'risks':
      return `/risks/${row.id}`
    case 'tasks':
      return `/tasks?id=${row.id}`
    case 'programs':
      return `/programs?id=${row.id}`
    case 'groups':
      return `/groups?id=${row.id}`
    case 'evidences':
      return `/evidence?id=${row.id}`
    case 'controlObjectives':
      return `/controls/${row.control?.id ?? row.controlId}/control-objectives`
    default:
      return ''
  }
}
