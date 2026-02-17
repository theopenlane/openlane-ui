import { create } from 'zustand'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

type TRiskState = {
  associations: TObjectAssociationMap
  initialAssociations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
  setAssociations: (associations: TObjectAssociationMap) => void
  setInitialAssociations: (associations: TObjectAssociationMap) => void
  setAssociationRefCodes: (associationRefCodes: TObjectAssociationMap) => void
}

export const useRisk = create<TRiskState>((set) => ({
  associations: {},
  initialAssociations: {},
  associationRefCodes: {
    controlIDs: [],
    internalPolicyIDs: [],
    procedureIDs: [],
    programIDs: [],
    subcontrolIDs: [],
    taskIDs: [],
  },
  setInitialAssociations: (initialAssociations) => set({ initialAssociations }),
  setAssociations: (associations) => set({ associations }),
  setAssociationRefCodes: (newAssociationRefCodes) => {
    const defaultKeys: (keyof TObjectAssociationMap)[] = ['controlIDs', 'internalPolicyIDs', 'procedureIDs', 'programIDs', 'subcontrolIDs', 'taskIDs']
    const normalized: TObjectAssociationMap = defaultKeys.reduce((acc, key) => {
      acc[key] = newAssociationRefCodes?.[key] ?? []
      return acc
    }, {} as TObjectAssociationMap)

    set({ associationRefCodes: normalized })
  },
}))
