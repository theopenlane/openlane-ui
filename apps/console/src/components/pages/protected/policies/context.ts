import { createContext } from 'react'
import { UpdateableFields } from '@/components/pages/protected/policies/policy-sidebar'
import { TElement } from '@udecode/plate-common'

export type Policy = {
  id?: string
  name: string
  status: string | null
  version: string | null
  policyType: string | null
  updatedAt: string | null
  updatedBy: string | null
  description: string | null
  background: string | null
  purposeAndScope: string | null
  details?: {
    content: TElement[]
  }
}

type PolicyContext = {
  policy?: Policy
  saveField: (field: UpdateableFields, value: string) => void
  onFieldChange?: (field: UpdateableFields, value: string) => void
}

export const PolicyContext = createContext<PolicyContext>({
  policy: {
    name: 'New Policy',
    status: 'new',
    version: '0',
    policyType: null,
    updatedAt: null,
    updatedBy: null,
    description: null,
    background: null,
    purposeAndScope: null,
    details: {
      content: [],
    },
  },
  // fetchPolicy: () => {
  //   // go get the policy
  // },
  saveField(field, value) {},
})
