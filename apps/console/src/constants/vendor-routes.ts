export type TVendorTabValue = 'overview' | 'documents' | 'contacts' | 'risk-review' | 'directory' | 'activity'

export const VENDORS_ROUTE = '/registry/vendors'

export const vendorDetailHref = (vendorId: string, tab?: TVendorTabValue) => `${VENDORS_ROUTE}/${encodeURIComponent(vendorId)}${tab ? `?tab=${tab}` : ''}`
