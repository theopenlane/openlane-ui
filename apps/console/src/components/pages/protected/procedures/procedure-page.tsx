import React, { useMemo } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProcedureSidebar } from '@/components/pages/protected/procedures/procedure-sidebar'
import { TElement, Value } from '@udecode/plate-common'
import { useRouter } from 'next/navigation'
import { DocumentDescriptions } from '@/components/shared/document-descriptions/document-descriptions'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures'
import { Procedure } from '@repo/codegen/src/schema'

type ProcedurePageProps = {
  procedureId: string
}

export function ProcedurePage({ procedureId }: ProcedurePageProps) {
  const router = useRouter()

  const { data } = useGetProcedureDetailsById(procedureId)

  const procedure = data?.procedure as Procedure

  const descriptions = useMemo(() => {
    let details: any = {} // add type after rich text update
    if (procedure?.details) {
      details = { ...details, ...JSON.parse(procedure?.details) }
    }
    return [
      { label: 'Purpose and Scope', value: details?.purposeAndScope ?? '' },
      { label: 'Description', value: details?.description },
      { label: 'Background', value: details?.background },
    ]
  }, [procedure])

  const actions = useMemo(() => {
    return [
      <Button key="edit-procedure" onClick={() => router.push(`/procedures/${procedureId}/edit`)} variant="outline" iconPosition="left" icon={<Pencil />}>
        Edit
      </Button>,
    ]
  }, [procedure])

  if (!procedure) return <></>

  const title = procedure.displayID ? `${procedure.displayID} - ${procedure.name}` : procedure.name

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading={title} actions={actions} />
      <TwoColumnLayout
        main={
          <>
            <DocumentDescriptions descriptions={descriptions} />

            <div className="text-2xl mb-5">Procedure</div>
            <div className="text-ellipsis overflow-hidden whitespace-pre-wrap">
              <PlateContentHTML content={(procedure?.details && (JSON.parse(procedure?.details) as Value)) || []} />
            </div>
          </>
        }
        aside={<ProcedureSidebar procedure={procedure} />}
      ></TwoColumnLayout>
    </>
  )
}

// PlateContentHTML placeholder until we get plate updated to we can use plate.serializeHtml
function PlateContentHTML({ content }: { content: Value }) {
  return <div>{content?.length && content?.map((e) => (e as TElement).children[0].text).join('\n')}</div>
}
