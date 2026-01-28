import { create } from 'zustand'

export type TOrgMembers = {
  value: string
  label: string
  membershipId: string
}

interface IAssetStoreState {
  selectedAsset: string | number | null
  setSelectedAsset: (assetId: string | number | null) => void
  orgMembers: TOrgMembers[] | undefined
  setOrgMembers: (members: TOrgMembers[] | undefined) => void
  clearSelectedAsset: () => void
}

export const useAssetStore = create<IAssetStoreState>((set) => ({
  selectedAsset: null,
  setSelectedAsset: (assetId) => set({ selectedAsset: assetId }),
  orgMembers: undefined,
  setOrgMembers: (members) => set({ orgMembers: members }),
  clearSelectedAsset: () => set({ selectedAsset: null }),
}))
