export const NDA_REQUEST_TABS = ['requested', 'approved', 'signed'] as const

export type TNdaRequestTab = (typeof NDA_REQUEST_TABS)[number]

export const NDA_REQUEST_TAB_PARAM = 'tab'

export const NDA_SIGNED_TAB: TNdaRequestTab = 'signed'

export const parseNdaRequestTab = (value: string | null): TNdaRequestTab => NDA_REQUEST_TABS.find((tab) => tab === value) ?? 'requested'
