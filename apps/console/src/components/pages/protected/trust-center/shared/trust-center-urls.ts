import { type TrustCenterNode } from '@/lib/graphql-hooks/trust-center'

export const TRUST_CENTER_HOST = 'trust.theopenlane.net'

export const getTrustCenterUrlState = (trustCenter: TrustCenterNode | null | undefined) => {
  const isDefaultDomainDisabled = trustCenter?.setting?.disableDefaultDomain === true
  const defaultUrl = trustCenter?.slug ? `https://${TRUST_CENTER_HOST}/${trustCenter.slug}` : ''
  const liveDefaultUrl = isDefaultDomainDisabled ? '' : defaultUrl

  return {
    isDefaultDomainDisabled,
    defaultUrl,
    liveDefaultUrl,
    needsSetup: !trustCenter?.previewDomain && !trustCenter?.customDomain && isDefaultDomainDisabled,
    publicUrl: trustCenter?.customDomain?.cnameRecord ?? liveDefaultUrl,
  }
}
