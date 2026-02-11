import { create } from 'zustand'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

type TPolicyState = {
  associations: TObjectAssociationMap
  initialAssociations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
  setAssociations: (associations: TObjectAssociationMap) => void
  setInitialAssociations: (associations: TObjectAssociationMap) => void
  setAssociationRefCodes: (associationRefCodes: TObjectAssociationMap) => void
}

export const usePolicy = create<TPolicyState>((set) => ({
  associations: {},
  initialAssociations: {},
  associationRefCodes: {
    taskIDs: [],
    controlObjectiveIDs: [],
    controlIDs: [],
    procedureIDs: [],
    programIDs: [],
  },
  setInitialAssociations: (initialAssociations) => set({ initialAssociations }),
  setAssociations: (associations) => set({ associations }),
  setAssociationRefCodes: (newAssociationRefCodes) => {
    const defaultKeys: (keyof TObjectAssociationMap)[] = ['taskIDs', 'controlObjectiveIDs', 'controlIDs', 'procedureIDs', 'programIDs']
    const normalized: TObjectAssociationMap = defaultKeys.reduce((acc, key) => {
      acc[key] = newAssociationRefCodes?.[key] ?? []
      return acc
    }, {} as TObjectAssociationMap)

    set({ associationRefCodes: normalized })
  },
}))
