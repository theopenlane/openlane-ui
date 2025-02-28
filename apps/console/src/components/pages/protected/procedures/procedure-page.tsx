import React, { useMemo } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProcedureSidebar } from '@/components/pages/protected/procedures/procedure-sidebar'
import { TElement, Value } from '@udecode/plate-common'
import { useGetProcedureDetailsByIdQuery } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import { DocumentDescriptions } from '@/components/shared/document-descriptions/document-descriptions'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import { TwoColumnLayout } from '@/components/shared/layouts/two-column-layout'

type ProcedurePageProps = {
  procedureId: string
}

export function ProcedurePage({ procedureId }: ProcedurePageProps) {
  const router = useRouter()

  const [{ data }] = useGetProcedureDetailsByIdQuery({ variables: { procedureId: procedureId } })

  const procedure = data?.procedure

  const descriptions = useMemo(() => {
    return [
      { label: 'Purpose and Scope', value: procedure?.purposeAndScope },
      { label: 'Description', value: procedure?.description },
      { label: 'Background', value: procedure?.background },
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
              <PlateContentHTML content={procedure.details?.content} />
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
