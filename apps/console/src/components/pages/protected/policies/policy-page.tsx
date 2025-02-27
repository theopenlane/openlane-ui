import React, { useMemo } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PolicySidebar } from '@/components/pages/protected/policies/policy-sidebar'
import { TElement, Value } from '@udecode/plate-common'
import { useGetInternalPolicyDetailsByIdQuery } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import { DocumentDescriptions } from '@/components/shared/document-descriptions/document-descriptions'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'

type PolicyPageProps = {
  policyId: string
}

export function PolicyPage({ policyId }: PolicyPageProps) {
  const router = useRouter()

  const [{ data }] = useGetInternalPolicyDetailsByIdQuery({ variables: { internalPolicyId: policyId } })

  const policy = data?.internalPolicy

  const descriptions = useMemo(() => {
    return [
      { label: 'Purpose and Scope', value: policy?.purposeAndScope },
      { label: 'Description', value: policy?.description },
      { label: 'Background', value: policy?.background },
    ]
  }, [policy])

  const actions = useMemo(() => {
    return [
      <Button key="edit-policy" onClick={() => router.push(`/policies/${policyId}/edit`)} variant="outline" iconPosition="left" icon={<Pencil />}>
        Edit
      </Button>,
    ]
  }, [policy])

  if (!policy) return <></>

  const title = policy.displayID ? `${policy.displayID} - ${policy.name}` : policy.name

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={title} actions={actions} />
      <TwoColumnLayout
        main={
          <>
            <DocumentDescriptions descriptions={descriptions} />

            <div className="text-2xl mb-5">Policy</div>
            <div className="text-ellipsis overflow-hidden whitespace-pre-wrap">
              <PlateContentHTML content={policy.details?.content} />
            </div>
          </>
        }
        aside={<PolicySidebar policy={policy} />}
      ></TwoColumnLayout>
    </>
  )
}

// PlateContentHTML placeholder undtil we get plate updated to we can use plate.serializeHtml
function PlateContentHTML({ content }: { content: Value }) {
  return <div>{content?.length && content?.map((e) => (e as TElement).children[0].text).join('\n')}</div>
}
