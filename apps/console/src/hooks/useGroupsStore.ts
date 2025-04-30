import { create } from 'zustand'

interface GroupsState {
  selectedGroup: string | null
  setSelectedGroup: (groupId: string | null) => void

  isAdmin: boolean
  setIsAdmin: (value: boolean) => void
}

export const useGroupsStore = create<GroupsState>((set) => ({
  selectedGroup: null,
  setSelectedGroup: (groupId) => set({ selectedGroup: groupId }),

  isAdmin: false,
  setIsAdmin: (value) => set({ isAdmin: value }),
}))
