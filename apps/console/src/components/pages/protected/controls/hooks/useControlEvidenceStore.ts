import { create } from 'zustand'

type TControlEvidenceStoreState = {
  isEditPreset: boolean
  setIsEditPreset: (edit: boolean) => void
}

export const useControlEvidenceStore = create<TControlEvidenceStoreState>((set) => ({
  isEditPreset: false,
  setIsEditPreset: (presetEdit) => set({ isEditPreset: presetEdit }),
}))
