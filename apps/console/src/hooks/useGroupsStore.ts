import { create } from 'zustand'

interface GroupsState {
  selectedGroup: string | null
  setSelectedGroup: (groupId: string | null) => void

  isAdmin: boolean
  setIsAdmin: (value: boolean) => void

  // ADD:
  reexecuteGroupsQuery: ((opts?: { requestPolicy?: string }) => void) | null
  setReexecuteGroupsQuery: (refetchFn: (opts?: { requestPolicy?: string }) => void) => void
}

export const useGroupsStore = create<GroupsState>((set) => ({
  selectedGroup: null,
  setSelectedGroup: (groupId) => set({ selectedGroup: groupId }),

  isAdmin: false,
  setIsAdmin: (value) => set({ isAdmin: value }),

  // Initialize to null; we’ll set it from GroupsPage
  reexecuteGroupsQuery: null,
  setReexecuteGroupsQuery: (refetchFn) => set({ reexecuteGroupsQuery: refetchFn }),
}))
