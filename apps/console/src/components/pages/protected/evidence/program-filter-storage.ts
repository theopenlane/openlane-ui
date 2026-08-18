import { createOrgPersistedStore, parseString } from '@/lib/storage/org-persisted-store'

const EVIDENCE_PROGRAM_FILTER_KEY = 'evidence-center-program-filter'

export const evidenceProgramFilterStore = createOrgPersistedStore<string | null>(EVIDENCE_PROGRAM_FILTER_KEY, parseString, () => null)
