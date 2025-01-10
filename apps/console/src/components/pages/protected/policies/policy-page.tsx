import React, { useState, useContext, useCallback, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicyInfoBar } from '@/components/pages/protected/policies/policy-info-bar'
import { PolicySidebar } from '@/components/pages/protected/policies/policy-sidebar'
import dynamic from 'next/dynamic'
import { TElement } from '@udecode/plate-common'
import internal from 'stream'
const PlateEditor = dynamic(() => import('@/components/shared/editor/plate'), { ssr: false })

export type EditableField = 'name' | 'description' | 'background' | 'purposeAndScope'

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

type PolicyPageProps = {
  internalPolicy: Policy
  save: (policy: Policy) => void
  delete: (policy: Policy) => void
}

export function PolicyPage({ save: savePolicy, delete: deletePolicy, internalPolicy }: PolicyPageProps) {
  console.log('PolicyPage: render', { internalPolicy })

  const [policy, setPolicy] = useState(internalPolicy)
  console.log({ policy: policy.updatedAt, internalPolicy: internalPolicy.updatedAt })
  useEffect(() => {
    setPolicy(internalPolicy)
  }, [internalPolicy])

  const saveField = (field: EditableField, value: string) => {
    console.log('saveField', field, value)
    const p = { ...policy, [field]: value }
    setPolicy(p)
    savePolicy(p)
  }

  const setField = (field: EditableField, value: string) => {
    setPolicy({ ...policy, [field]: value })
  }

  const onFieldChange = (field: EditableField, value: string) => {
    console.log('onFieldChange', field, value)
    setField(field, value)
  }

  const handleSave = () => {
    console.log('handleSave')
    savePolicy(policy)
  }

  const handleDelete = () => {
    console.log('handleDelete')
    deletePolicy(policy)
  }

  const onNameChange = (name: string) => {
    console.log('onNameChange', name)
    saveField('name', name)
  }

  const onDocumentChange = useCallback((content: TElement[]) => {
    console.log('onDocumentChange', name)
    setPolicy({ ...policy, details: { content } })
  }, [])

  return (
    <>
      <PageHeading
        className="grow"
        eyebrow="Policies & Procedures"
        heading={policy.name}
        editable
        onChange={onNameChange}
      />

      <PolicyInfoBar
        status={policy.status}
        version={policy.version}
        policyType={policy.policyType}
        updatedAt={policy.updatedAt}
      />

      <div className="flex flex-col gap-5 w-full">
        {/* Sidebar */}
        <PolicySidebar
          policy={policy}
          onFieldChange={onFieldChange}
          saveField={saveField}
          onSave={handleSave}
          onDelete={handleDelete}
        />

        {/* Main */}
        <div className="w-full">
          <div>
            <PlateEditor content={policy.details?.content ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
