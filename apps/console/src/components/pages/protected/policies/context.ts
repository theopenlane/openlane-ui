import { createContext } from 'react'
import { UpdateableFields } from '@/components/pages/protected/policies/policy-sidebar'

export type Policy = {
  id?: string
  name: string
  status?: string | null
  version?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  description?: string | null
  purposeAndScope?: string | null
  background?: string | null
  details?: any | null
}

type PolicyContext = {
  policyId?: string
  saveField: (field: UpdateableFields, value: string) => void
  onFieldChange?: (field: UpdateableFields, value: string) => void
  create?: () => void
  policy?: Policy
}

export const PolicyContext = createContext<PolicyContext>({
  policy: {},
  // fetchPolicy: () => {
  //   // go get the policy
  // },
  saveField(field, value) {},
  save() {},
  create() {},
})
