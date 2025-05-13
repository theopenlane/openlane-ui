import { create } from 'zustand'

type TControlEvidenceStoreState = {
  selectedControlEvidence: string | null
  setSelectedControlEvidence: (groupId: string | null) => void
}

export const useControlEvidenceStore = create<TControlEvidenceStoreState>((set) => ({
  selectedControlEvidence: null,
  setSelectedControlEvidence: (groupId) => set({ selectedControlEvidence: groupId }),
}))
