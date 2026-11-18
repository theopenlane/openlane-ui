type TDedupableDirectoryAccount = {
  externalID: string
  sourceDefinitionID?: string | null
  sourceInstanceID?: string | null
  integration?: { id: string } | null
}

const externalAccountKey = ({ sourceDefinitionID, sourceInstanceID, externalID }: TDedupableDirectoryAccount) =>
  sourceInstanceID ? `${sourceDefinitionID ?? ''}:${sourceInstanceID}:${externalID}` : null

export const dedupeDirectoryAccounts = <T extends TDedupableDirectoryAccount>(accountsNewestFirst: T[]): T[] => {
  const kept = new Map<string, T>()

  accountsNewestFirst.forEach((account) => {
    const key = externalAccountKey(account)
    if (!key) return
    const current = kept.get(key)
    if (!current || (!current.integration && account.integration)) {
      kept.set(key, account)
    }
  })

  return accountsNewestFirst.filter((account) => {
    const key = externalAccountKey(account)
    return !key || kept.get(key) === account
  })
}
