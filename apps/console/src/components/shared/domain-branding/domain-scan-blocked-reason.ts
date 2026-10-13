export const NO_DOMAIN_REASON = 'No domain is associated with this organization yet. Add one in Organization Settings, then try again.'

type TDomainScanAction = 'pull branding' | 'detect branding'

type TDomainScanBlockers = {
  isChecking: boolean
  scanHistoryUnavailable: boolean
  hasDomains: boolean
  availableIn: string | null
  runningScanTarget: string | null
}

export const getDomainScanBlockedReason = ({ isChecking, scanHistoryUnavailable, hasDomains, availableIn, runningScanTarget }: TDomainScanBlockers, action: TDomainScanAction): string | null => {
  if (isChecking) return null
  if (scanHistoryUnavailable) return "We couldn't check whether a domain scan is already running. Please try again later."
  if (!hasDomains) return NO_DOMAIN_REASON
  if (availableIn) return `Your organization can run one domain scan an hour. You can ${action} again in ${availableIn}.`
  if (runningScanTarget) return `A domain scan for ${runningScanTarget} is already running. We'll let you know when it's done.`
  return null
}
