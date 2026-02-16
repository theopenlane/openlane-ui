import { create } from 'zustand'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

type TProcedureState = {
  associations: TObjectAssociationMap
  initialAssociations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
  setInitialAssociations: (associations: TObjectAssociationMap) => void
  setAssociations: (associations: TObjectAssociationMap) => void
  setAssociationRefCodes: (associationRefCodes: TObjectAssociationMap) => void
}

export const useProcedure = create<TProcedureState>((set) => ({
  associations: {},
  initialAssociations: {},
  associationRefCodes: {
    taskIDs: [],
    controlIDs: [],
    internalPolicyIDs: [],
    programIDs: [],
    riskIDs: [],
  },
  setInitialAssociations: (initialAssociations) => set({ initialAssociations }),
  setAssociations: (associations) => set({ associations }),
  setAssociationRefCodes: (newAssociationRefCodes) => {
    const defaultKeys: (keyof TObjectAssociationMap)[] = ['taskIDs', 'controlIDs', 'internalPolicyIDs', 'programIDs', 'riskIDs']
    const normalized: TObjectAssociationMap = defaultKeys.reduce((acc, key) => {
      acc[key] = newAssociationRefCodes?.[key] ?? []
      return acc
    }, {} as TObjectAssociationMap)

    set({ associationRefCodes: normalized })
  },
}))
