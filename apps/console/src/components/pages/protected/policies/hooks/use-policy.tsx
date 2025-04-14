import { create } from 'zustand'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

type TPolicyState = {
  associations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
  setAssociations: (associations: TObjectAssociationMap) => void
  setAssociationRefCodes: (associationRefCodes: TObjectAssociationMap) => void
}

export const usePolicy = create<TPolicyState>((set) => ({
  associations: {},
  associationRefCodes: {
    taskIDs: [],
    controlObjectiveIDs: [],
    controlIDs: [],
    procedureIDs: [],
    programIDs: [],
  },
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
