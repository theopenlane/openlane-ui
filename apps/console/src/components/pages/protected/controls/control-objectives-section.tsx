import { CreateButton } from '@/components/shared/create-button/create-button'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { GetControlByIdQuery } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

type Props = {
  controlObjectives: GetControlByIdQuery['control']['controlObjectives']
}

const ControlObjectivesSection = ({ controlObjectives }: Props) => {
  const { convertToReadOnly } = usePlateEditor()
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined

  const edges =
    controlObjectives?.edges?.filter(
      (
        edge,
      ): edge is NonNullable<typeof edge> & {
        node: { desiredOutcome: string }
      } => !!edge?.node?.desiredOutcome,
    ) ?? []

  const hasData = edges.length > 0

  const controlObjectivesPath = subcontrolId ? `/controls/${id}/${subcontrolId}/control-objectives` : `/controls/${id}/control-objectives`
  const createHref = controlObjectivesPath + '?create=true'
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Label className="font-semibold text-lg">{edges.length === 1 ? 'Control Objective' : 'Control Objectives'}</Label>
        <CreateButton type="control-objective" href={createHref} />
        <Link href={controlObjectivesPath}>
          <Button type="button" className="!h-8 !p-2 size-fit" variant="outline" icon={<ChevronRight size={16} />}>
            View
          </Button>
        </Link>
      </div>
      {hasData ? (
        edges.length === 1 ? (
          <div>{convertToReadOnly(edges[0].node.desiredOutcome)}</div>
        ) : (
          <ul className="list-disc pl-5 space-y-2">
            {edges.map((edge, i) => (
              <li key={i}>{convertToReadOnly(edge.node.desiredOutcome)}</li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-text-informational italic">No control objective set</p>
      )}
    </div>
  )
}

export default ControlObjectivesSection
