import { create } from 'zustand'

interface ITaskStoreState {
  selectedTask: string | number | null
  setSelectedTask: (taskId: string | number | null) => void
}

export const useTaskStore = create<ITaskStoreState>((set) => ({
  selectedTask: null,
  setSelectedTask: (taskId) => set({ selectedTask: taskId }),
}))
