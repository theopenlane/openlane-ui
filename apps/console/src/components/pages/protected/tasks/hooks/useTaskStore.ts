import { create } from 'zustand'

export type TOrgMembers = {
  value: string
  label: string
  membershipId: string
}

interface ITaskStoreState {
  selectedTask: string | number | null
  setSelectedTask: (taskId: string | number | null) => void
  orgMembers: TOrgMembers[] | undefined
  setOrgMembers: (members: TOrgMembers[] | undefined) => void
  clearSelectedTask: () => void
}

export const useTaskStore = create<ITaskStoreState>((set) => ({
  selectedTask: null,
  setSelectedTask: (taskId) => set({ selectedTask: taskId }),
  orgMembers: undefined,
  setOrgMembers: (members) => set({ orgMembers: members }),
  clearSelectedTask: () => set({ selectedTask: null }),
}))
