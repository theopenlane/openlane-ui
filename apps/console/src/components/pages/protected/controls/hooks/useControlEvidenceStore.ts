import { create } from 'zustand'

type TControlEvidenceStoreState = {
  selectedControlEvidence: string | null
  isEditPreset: boolean

  setSelectedControlEvidence: (groupId: string | null) => void
  setIsEditPreset: (edit: boolean) => void
}

export const useControlEvidenceStore = create<TControlEvidenceStoreState>((set) => ({
  selectedControlEvidence: null,
  isEditPreset: false,

  setSelectedControlEvidence: (groupId) => set({ selectedControlEvidence: groupId }),
  setIsEditPreset: (presetEdit) => set({ isEditPreset: presetEdit }),
}))
