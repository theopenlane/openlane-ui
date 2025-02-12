import { create } from 'zustand'

interface GroupsState {
  activeTab: 'table' | 'card'
  setActiveTab: (tab: 'table' | 'card') => void

  selectedGroup: string | null
  setSelectedGroup: (groupId: string | null) => void

  isAdmin: boolean
  setIsAdmin: (value: boolean) => void
}

export const useGroupsStore = create<GroupsState>()((set) => ({
  activeTab: 'table',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedGroup: null,
  setSelectedGroup: (groupId) => set({ selectedGroup: groupId }),

  isAdmin: false,
  setIsAdmin: (value) => set({ isAdmin: value }),
}))
