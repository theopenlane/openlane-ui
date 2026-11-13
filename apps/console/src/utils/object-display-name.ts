export type TObjectNameSource = {
  refCode?: string | null
  cveID?: string | null
  fullName?: string | null
  displayName?: string | null
  name?: string | null
  title?: string | null
  target?: string | null
  externalID?: string | null
  displayID?: string | null
}

export const getObjectDisplayName = (node: TObjectNameSource | null | undefined): string => {
  if (!node) return ''
  const candidates = [node.refCode, node.cveID, node.fullName, node.displayName, node.name, node.title, node.target, node.externalID, node.displayID]
  return candidates.find((value) => value?.trim())?.trim() ?? ''
}
