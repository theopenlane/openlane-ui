export const getHrefForObjectType = (
  kind: string,
  row: {
    id: string
    control?: { id: string }
  },
): string => {
  switch (kind) {
    case 'policies':
      return `/policies/${row.id}/view`
    case 'procedures':
      return `/procedures/${row.id}/view`
    case 'controls':
      return `/controls/${row.id}`
    case 'subcontrols':
      return `/controls/${row.control?.id}/${row.id}`
    case 'risks':
      return `/risks/${row.id}`
    case 'tasks':
      return `/tasks?id=${row.id}`
    case 'programs':
      return `/programs?id=${row.id}`
    case 'groups':
      return `/groups?id=${row.id}`

    default:
      return ``
  }
}
