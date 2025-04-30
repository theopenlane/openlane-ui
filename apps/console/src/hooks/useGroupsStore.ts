import { create } from 'zustand'
import { Group } from '@repo/codegen/src/schema.ts'

interface GroupsState {
  selectedGroup: string | null
  setSelectedGroup: (groupId: string | null) => void

  isAdmin: boolean
  setIsAdmin: (value: boolean) => void

  groups: Group[]
  setGroups: (incomingGroups: Group[]) => void
}

export const useGroupsStore = create<GroupsState>((set) => ({
  selectedGroup: null,
  setSelectedGroup: (groupId) => set({ selectedGroup: groupId }),

  isAdmin: false,
  setIsAdmin: (value) => set({ isAdmin: value }),

  groups: [],
  setGroups: (incomingGroups) =>
    set((state) => {
      const newGroups = incomingGroups.filter((incoming) => !state.groups.some((existing) => existing.id === incoming.id))
      return { groups: [...state.groups, ...newGroups] }
    }),
}))
