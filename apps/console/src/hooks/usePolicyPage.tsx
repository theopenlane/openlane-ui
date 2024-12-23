import { create } from 'zustand'
import { TElement } from '@udecode/plate-common'
import { useCreateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { CombinedError } from 'urql'

type EditableField = 'description' | 'background' | 'purposeAndScope'

type Policy = {
  id?: string
  name?: string
  status?: string
  version?: string
  policyType?: string
  updatedAt?: string
  description?: string | null
  background?: string | null
  purposeAndScope?: string | null
  details?: {
    content: TElement[]
  }
}

type State = {
  policy: Policy
  loading: boolean
  error: CombinedError | null
  actions: Actions
}

type Actions = {
  // create: () => void
  update: () => void
  save: () => void
  delete: () => void
  saveField: (field: EditableField, value: string) => void
  setPolicy: (policy: Policy) => void
  setField: (field: EditableField, value: string) => void
  saveHandler?: (policy: Policy) => void
}

export const usePolicyPageStore = create<State>((set, get) => ({
  policy: {},
  loading: false,
  error: null,
  actions: {
    setField: (field: EditableField, value: string) => {
      return set((state) => ({ policy: { ...state.policy, [field]: value } }))
    },
    // create: async () => {
    //   const state = get()
    //   const policy = state.policy
    //   if (policy.name) {
    //     const { data, error } = await createPolicy({
    //       input: {
    //         name: policy.name,
    //         description: policy.description,
    //       },
    //     })

    //     return set(() => ({ error, policy: data?.createInternalPolicy.internalPolicy }))
    //   }
    // },
    update: () => {
      console.log('update')
    },
    save: () => {
      // const state = get()
      // if (state.saveHandler) state.saveHandler(state.policy)
    },
    delete: () => {
      console.log('delete')
    },
    saveField: (field: EditableField, value: string) => {
      console.log('saveField', field, value)
    },
    setPolicy: (policy: Policy) => set((state) => ({ policy })),
  },
}))

export const usePolicyPageActions = () => usePolicyPageStore((state) => state.actions)
