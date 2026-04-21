type BulkActionFailureDescriptionArgs = {
  failedCount: number
  singular: string
  fallback: string
  verb?: string
}

export const getBulkActionFailureDescription = ({ failedCount, singular, fallback, verb = 'did not succeed' }: BulkActionFailureDescriptionArgs) => {
  if (failedCount < 1) {
    return fallback
  }

  return `${failedCount} ${singular}${failedCount === 1 ? '' : 's'} ${verb}.`
}
