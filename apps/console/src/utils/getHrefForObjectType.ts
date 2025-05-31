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
      return `/risks?id=${row.id}`
    // case 'tasks':
    //   return `/tasks?id=${row.id}` //TODO: TASKS NEED REFACTOR SO WE CAN COME TO ID AND REDNDER DETAILS IN SHEET
    case 'programs':
      return `/programs?id=${row.id}`

    default:
      return ``
  }
}
