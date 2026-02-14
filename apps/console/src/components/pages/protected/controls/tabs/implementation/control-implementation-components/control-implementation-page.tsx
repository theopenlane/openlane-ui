'use client'

import React, { useContext, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useDeleteControlImplementation, useGetAllControlImplementations, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'
import { ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ArrowRight, CirclePlus, Settings2 } from 'lucide-react'
import { PageHeading } from '@repo/ui/page-heading'
import { Button } from '@repo/ui/button'
import { Loading } from '@/components/shared/loading/loading'
import CreateControlImplementationSheet from './create-control-implementation-sheet'
import { useNotification } from '@/hooks/useNotification'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetControlById } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { ImplementationItem } from './implementation-item'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const ControlImplementationPage = () => {
  const searchParams = useSearchParams()

  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [editData, setEditData] = useState<ControlImplementationFieldsFragment | null>(null)

  const { successNotification, errorNotification } = useNotification()
  const { data, isLoading } = useGetAllControlImplementations({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
  })

  const { setCrumbs } = useContext(BreadcrumbContext)
  const isControl = !subcontrolId && !!id
  const isSubControl = !!subcontrolId
  const { data: controlData, isLoading: isControlLoading } = useGetControlById(isControl ? (id as string) : null)
  const { data: subcontrolData, isLoading: isSubcontrolLoading } = useGetSubcontrolById(isSubControl ? (subcontrolId as string) : null)

  const { mutateAsync: updateImplementation, isPending } = useUpdateControlImplementation()
  const { mutateAsync: deleteImplementation } = useDeleteControlImplementation()
  const edges = data?.controlImplementations?.edges?.filter((edge): edge is { node: ControlImplementationFieldsFragment } => !!edge?.node)

  const { data: orgPermission } = useOrganizationRoles()
  const createAllowed = canCreate(orgPermission?.roles, AccessEnum.CanCreateControlImplementation)

  const handleMarkVerified = async (id: string, verified: boolean) => {
    try {
      await updateImplementation({
        updateControlImplementationId: id,
        input: { verified },
      })
      successNotification({ title: verified ? 'Marked as verified' : 'Marked as not verified' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteImplementation({ deleteControlImplementationId: id })
      successNotification({ title: 'Control Implementation deleted' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    const shouldOpen = createAllowed && searchParams.get('create') === 'true'
    if (shouldOpen) {
      setShowCreateSheet(true)
    }
  }, [createAllowed, searchParams])

  useEffect(() => {
    if (controlData) {
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Controls', href: '/controls' },
        { label: controlData?.control?.refCode, isLoading: isControlLoading, href: `/controls/${id}` },
        { label: 'Control Implementation' },
      ])
    }
    if (subcontrolData) {
      setCrumbs([
        { label: 'Home', href: '/dashboard' },
        { label: 'Controls', href: '/controls' },
        { label: subcontrolData?.subcontrol?.refCode, isLoading: isSubcontrolLoading, href: `/controls/${id}/${subcontrolId}` },
        { label: 'Control Implementation' },
      ])
    }
  }, [setCrumbs, controlData, subcontrolData, id, isControlLoading, isSubcontrolLoading, subcontrolId])

  if (isLoading) {
    return <Loading />
  }

  if (!edges?.length) {
    return (
      <>
        <CreateControlImplementationSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} />
        <div className="flex flex-col items-center justify-center h-[60vh] text-center text-gray-300">
          <Settings2 className="w-20 h-20 mb-4 text-border" strokeWidth={1} />
          <p className="mb-2 text-sm">No Implementations found for this Control.</p>
          <div className="text-blue-500 flex items-center gap-1 cursor-pointer">
            <p onClick={() => setShowCreateSheet(true)} className="text-blue-500">
              Create a new one
            </p>
            <ArrowRight className="mt-0.5" size={16} />
          </div>
        </div>
      </>
    )
  }

  return (
    <div>
      <CreateControlImplementationSheet
        open={showCreateSheet}
        onOpenChange={(open) => {
          setShowCreateSheet(open)
          if (!open) setEditData(null)
        }}
        editData={editData}
      />
      <div className="flex justify-between items-center">
        <PageHeading heading="Control Implementations" />
        {createAllowed && (
          <Button variant="secondary" className="h-8 px-2!" icon={<CirclePlus />} iconPosition="left" onClick={() => setShowCreateSheet(true)}>
            Create
          </Button>
        )}
      </div>
      <div className="space-y-4 mt-6">
        {edges.map((edge) => (
          <ImplementationItem
            key={edge.node.id}
            node={edge.node}
            onEdit={(n) => {
              setEditData(n)
              setShowCreateSheet(true)
            }}
            onMarkVerified={handleMarkVerified}
            onDelete={handleDelete}
            isUpdating={isPending}
          />
        ))}
      </div>
    </div>
  )
}

export default ControlImplementationPage
