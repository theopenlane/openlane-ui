import { create } from 'zustand'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap.ts'

type TProcedureState = {
  associations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
  setAssociations: (associations: TObjectAssociationMap) => void
  setAssociationRefCodes: (associationRefCodes: TObjectAssociationMap) => void
}

export const useProcedure = create<TProcedureState>((set) => ({
  associations: {},
  associationRefCodes: {
    taskIDs: [],
    controlIDs: [],
    internalPolicyIDs: [],
    programIDs: [],
    riskIDs: [],
  },
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
