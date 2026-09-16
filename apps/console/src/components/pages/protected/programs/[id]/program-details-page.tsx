'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetProgramBasicInfo, useUpdateProgram, useDeleteProgram } from '@/lib/graphql-hooks/program'
import ProgramOverviewTab from '@/components/pages/protected/programs/[id]/program-overview-tab'
import ProgramWorkView from '@/components/pages/protected/programs/[id]/work/program-work-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Cog, FolderOpen, CirclePlus, CopyPlus, Archive, ArchiveRestore, Trash2, LayoutList, LayoutDashboard } from 'lucide-react'
import { hasPermission, canEdit, canDelete } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@/lib/authz/enums/access-enum.ts'
import Menu from '@/components/shared/menu/menu.tsx'
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
import { useSession } from 'next-auth/react'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { ProgramIconMapper } from '@/components/shared/enum-mapper/program-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

const PROGRAM_TABS = ['overview', 'work'] as const
type TProgramTabValue = (typeof PROGRAM_TABS)[number]
const PROGRAM_DEFAULT_TAB: TProgramTabValue = 'overview'
const PROGRAM_TAB_QUERY_PARAM = 'tab'

const isProgramTab = (value: string | null): value is TProgramTabValue => PROGRAM_TABS.includes(value as TProgramTabValue)

const ProgramDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const router = useRouter()
  const { replace: replaceParams } = useSmartRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get(PROGRAM_TAB_QUERY_PARAM)
  const activeTab: TProgramTabValue = isProgramTab(tabParam) ? tabParam : PROGRAM_DEFAULT_TAB
  const { data: basicInfoData, isLoading } = useGetProgramBasicInfo(id)
  const { data: permission } = useOrganizationRoles()
  const { data: objectPermission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const { data: session } = useSession()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateProgram, isPending: isUpdatingStatus } = useUpdateProgram()
  const { mutateAsync: deleteProgram, isPending: isDeleting } = useDeleteProgram()

  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const canCreateProgram = hasPermission(permission?.roles, AccessEnum.CanCreateProgram, session)
  const editAllowed = canEdit(objectPermission?.roles, session)
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

  const handleTabChange = useCallback(
    (value: string) => {
      if (!isProgramTab(value)) return

      replaceParams({ [PROGRAM_TAB_QUERY_PARAM]: value === PROGRAM_DEFAULT_TAB ? null : value })
    },
    [replaceParams],
  )

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
            <div className="flex gap-3 items-center min-w-0">
              <h1 className="truncate">{programName}</h1>
              {basicInfoData?.program?.status && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-sm">
                  {ProgramIconMapper[basicInfoData.program.status]}
                  {getEnumLabel(basicInfoData.program.status)}
                </span>
              )}
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
                    <Link href={PROGRAMS_LIST_HREF} onClick={close} className="flex w-full items-start gap-2 px-1 py-1 text-sm hover:text-brand">
                      <FolderOpen size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
                      <span className="flex flex-col">
                        <span>View All Programs</span>
                        <span className="text-xs text-muted-foreground">Including archived programs</span>
                      </span>
                    </Link>
                    {canCreateProgram && (
                      <Link href="/programs/create" onClick={close} className="flex w-full items-center gap-2 px-1 py-1 text-sm hover:text-brand">
                        <CirclePlus size={16} strokeWidth={2} className="shrink-0" />
                        <span>Create Program</span>
                      </Link>
                    )}
                    {canCreateProgram && (
                      <Link href={`/programs/create/from-existing?from=${id}`} onClick={close} className="flex w-full items-center gap-2 px-1 py-1 text-sm hover:text-brand">
                        <CopyPlus size={16} strokeWidth={2} className="shrink-0" />
                        <span>Duplicate Program</span>
                      </Link>
                    )}
                    {editAllowed && (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-1 py-1 text-sm hover:text-brand"
                        onClick={() => {
                          close()
                          setStatusDialogOpen(true)
                        }}
                      >
                        {isArchived ? <ArchiveRestore size={16} strokeWidth={2} className="shrink-0" /> : <Archive size={16} strokeWidth={2} className="shrink-0" />}
                        <span>{isArchived ? 'Unarchive Program' : 'Archive Program'}</span>
                      </button>
                    )}
                    {deleteAllowed && (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-1 py-1 text-sm text-destructive hover:opacity-80"
                        onClick={() => {
                          close()
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 size={16} strokeWidth={2} className="shrink-0" />
                        <span>Delete Program</span>
                      </button>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
        <div className="relative pb-1 mb-1">
          <TabsList className="w-auto flex justify-start">
            <TabsTrigger value="overview" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <LayoutList className="mr-2 h-4 w-4" />
              <span>Work</span>
            </TabsTrigger>
          </TabsList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0.5 left-0.5 h-px shadow-[inset_0_-1px_0_0_var(--color-border)]" />
        </div>
        <TabsContent value="overview" className="mt-6">
          <ProgramOverviewTab program={basicInfoData?.program} />
        </TabsContent>
        <TabsContent value="work" className="mt-6">
          <ProgramWorkView programId={id} />
        </TabsContent>
      </Tabs>

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
