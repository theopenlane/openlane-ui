import { CreateButton } from '@/components/shared/create-button/create-button'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canCreate } from '@/lib/authz/utils'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { GetControlByIdQuery } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

type Props = {
  controlImplementations: GetControlByIdQuery['control']['controlImplementations']
}

const ControlImplementationsSection = ({ controlImplementations }: Props) => {
  const { convertToReadOnly } = usePlateEditor()
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined

  const { data: orgPermission } = useOrganizationRoles()

  const createAllowed = canCreate(orgPermission?.roles, AccessEnum.CanCreateControlObjective)

  const edges = controlImplementations?.edges?.filter((edge): edge is NonNullable<typeof edge> & { node: { details: string } } => !!edge?.node?.details) ?? []

  const hasData = edges.length > 0

  const controlImplementationPath = subcontrolId ? `/controls/${id}/${subcontrolId}/control-implementation` : `/controls/${id}/control-implementation`
  const createHref = controlImplementationPath + '?create=true'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Label className="font-semibold text-lg">{edges.length === 1 ? 'Control Implementation' : 'Control Implementations'}</Label>
        {createAllowed && <CreateButton type="control-implementation" href={createHref} ariaLabel="Create control implementation" />}
        <Link href={controlImplementationPath}>
          <Button type="button" className="!h-8 !p-2 size-fit" variant="outline" icon={<ChevronRight size={16} />}>
            View
          </Button>
        </Link>
      </div>
      {hasData ? (
        edges.length === 1 ? (
          <div>{convertToReadOnly(edges[0].node.details)}</div>
        ) : (
          <ul className="list-disc pl-5 space-y-2">
            {edges.map((edge, i) => (
              <li key={i}>{convertToReadOnly(edge.node.details)}</li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-text-informational italic">No control implementations set</p>
      )}
    </div>
  )
}

export default ControlImplementationsSection
