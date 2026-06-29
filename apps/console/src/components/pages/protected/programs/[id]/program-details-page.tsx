'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetProgramBasicInfo, useUpdateProgram, useDeleteProgram } from '@/lib/graphql-hooks/program'
import StatsCards from '@/components/shared/stats-cards/stats-cards'
import BasicInformation from '@/components/pages/protected/programs/[id]/basic-info'
import ProgramAuditor from '@/components/pages/protected/programs/[id]/program-auditor'
import ProgramTaskTable from '@/components/pages/protected/programs/[id]/program-tasks-table/program-tasks-table'
import { ControlsSummaryCard } from '@/components/pages/protected/programs/[id]/controls-summary-card'
import { Cog, FolderOpen, CirclePlus, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { hasPermission, canEdit, canDelete } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
import TimelineReadiness from '@/components/pages/protected/programs/[id]/timeline-readiness'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { useOrganization } from '@/hooks/useOrganization'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useOrganizationRoles, useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ProgramProgramStatus } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { PROGRAMS_LIST_HREF } from '@/constants/programs'
import { ProgramsPageSkeleton } from '../skeleton/programs-page-skeleton'

const ProgramDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const router = useRouter()
  const { data: basicInfoData, isLoading } = useGetProgramBasicInfo(id)
  const { data: permission } = useOrganizationRoles()
  const { data: objectPermission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateProgram, isPending: isUpdatingStatus } = useUpdateProgram()
  const { mutateAsync: deleteProgram, isPending: isDeleting } = useDeleteProgram()

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const canCreateProgram = hasPermission(permission?.roles, AccessEnum.CanCreateProgram)
  const editAllowed = canEdit(objectPermission?.roles)
  const deleteAllowed = canDelete(objectPermission?.roles)
  const isArchived = basicInfoData?.program?.status === ProgramProgramStatus.ARCHIVED
  const programName = basicInfoData?.program?.name ?? ''

  const handleToggleArchive = async () => {
    try {
      await updateProgram({ updateProgramId: id, input: { status: isArchived ? ProgramProgramStatus.IN_PROGRESS : ProgramProgramStatus.ARCHIVED } })
      successNotification({ title: isArchived ? 'The program has been successfully unarchived.' : 'The program has been successfully archived.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setStatusDialogOpen(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProgram({ deleteProgramId: id })
      successNotification({ title: 'The program has been successfully deleted.' })
      setDeleteOpen(false)
      router.replace(PROGRAMS_LIST_HREF)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      setDeleteOpen(false)
    }
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: PROGRAMS_LIST_HREF },
      { label: 'Programs', href: PROGRAMS_LIST_HREF },
      { label: basicInfoData?.program?.name, isLoading },
    ])
  }, [setCrumbs, basicInfoData, isLoading])

  useEffect(() => {
    if (basicInfoData) document.title = `${currentOrganization?.node?.displayName ?? 'Openlane'} | Programs - ${basicInfoData.program.name}`
  }, [basicInfoData, currentOrganization?.node?.displayName])

  if (isLoading) {
    return <ProgramsPageSkeleton />
  }

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h1>Overview</h1>
            </div>
            <div className="flex gap-2.5 items-center">
              <Link href={`/programs/${id}/settings`}>
                <Button variant="primary" className="h-8 !px-2 !pl-3" icon={<Cog />} iconPosition="left">
                  Edit Settings
                </Button>
              </Link>
              <Menu
                closeOnSelect
                content={(close) => (
                  <>
                    <Link href={PROGRAMS_LIST_HREF} onClick={close} className="flex items-start gap-2 px-1 py-1 text-sm hover:text-brand">
                      <FolderOpen size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                      <span className="flex flex-col">
                        <span>View All Programs</span>
                        <span className="text-xs text-muted-foreground">Including archived programs</span>
                      </span>
                    </Link>
                    {canCreateProgram && (
                      <Link href="/programs/create" onClick={close} className="flex">
                        <Button type="button" size="sm" variant="transparent" className="flex w-full justify-start space-x-2">
                          <CirclePlus size={16} strokeWidth={2} />
                          <span>Create Program</span>
                        </Button>
                      </Link>
                    )}
                    {editAllowed && (
                      <Button
                        type="button"
                        size="sm"
                        variant="transparent"
                        className="flex justify-start space-x-2"
                        onClick={() => {
                          close()
                          setStatusDialogOpen(true)
                        }}
                      >
                        {isArchived ? <ArchiveRestore size={16} strokeWidth={2} /> : <Archive size={16} strokeWidth={2} />}
                        <span>{isArchived ? 'Unarchive Program' : 'Archive Program'}</span>
                      </Button>
                    )}
                    {deleteAllowed && (
                      <Button
                        type="button"
                        size="sm"
                        variant="transparent"
                        className="flex justify-start space-x-2 text-destructive"
                        onClick={() => {
                          close()
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 size={16} strokeWidth={2} />
                        <span>Delete Program</span>
                      </Button>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-7">
        <div className="flex gap-7 w-full">
          {basicInfoData?.program ? (
            <>
              <BasicInformation />
              <div className="flex flex-col gap-7 flex-1">
                <TimelineReadiness />
                <ProgramAuditor
                  programStatus={basicInfoData.program.status}
                  firm={basicInfoData.program.auditFirm}
                  name={basicInfoData.program.auditor}
                  email={basicInfoData.program.auditorEmail}
                  isReady={basicInfoData.program.auditorReady}
                />
              </div>
            </>
          ) : (
            <div>No program info available</div>
          )}
        </div>

        <StatsCards />
        <ProgramTaskTable />
        <ControlsSummaryCard />
      </div>

      <ConfirmationDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={handleToggleArchive}
        title={`${isArchived ? 'Unarchive' : 'Archive'} Program ${programName}?`}
        description={isArchived ? 'This restores the program to your active list' : 'Archiving moves this program out of your active list. You can unarchive it again at any time'}
        confirmationText={isArchived ? 'Unarchive' : 'Archive'}
        confirmationTextVariant="primary"
        loading={isUpdatingStatus}
      />

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title={`Delete Program ${programName}?`}
        description={
          <>
            This action cannot be undone. This will permanently delete <b>{programName}</b>
          </>
        }
        confirmationText="Delete"
        confirmationTextVariant="destructive"
        showInput
        loading={isDeleting}
      />
    </>
  )
}

export default ProgramDetailsPage
