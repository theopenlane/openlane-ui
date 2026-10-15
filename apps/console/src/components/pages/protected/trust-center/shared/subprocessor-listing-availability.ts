type TListingTrustCenter = { subprocessorURL?: string | null }

export const subprocessorListingBlockedReason = (trustCenter: TListingTrustCenter | null | undefined): string | undefined => {
  if (!trustCenter) return 'Your organization does not have a Trust Center yet. Set one up before adding subprocessors to it.'
  if (trustCenter.subprocessorURL) return 'Your Trust Center links to an external subprocessor list. Switch it to managing subprocessors in Openlane before adding vendors.'
  return undefined
}
