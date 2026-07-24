'use client'

import React, { use, useEffect, useMemo, useState } from 'react'
import { type ProgramFromGetProgramDashboard as Program, useGetProgramDashboard } from '@/lib/graphql-hooks/program'
import { Calendar, ChevronRight, SquarePlus, SearchIcon, UserRoundPlus, Undo, UserIcon, TriangleAlert } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { formatDate, isPastDate } from '@/utils/date'
import { useAccountRolesMany, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { hasPermission, canEdit } from '@/lib/authz/utils'
import Link from 'next/link'
import { ProgramProgramStatus, type ProgramWhereInput, TaskTaskStatus } from '@repo/codegen/src/schema'
import { Switch } from '@repo/ui/switch'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { ProgramIconMapper, ProgramSettingsIconBtn } from '@/components/shared/enum-mapper/program-enum'
import { Separator } from '@repo/ui/separator'
import Menu from '@/components/shared/menu/menu'
import clsx from 'clsx'
import { useUpdateProgram } from '@/lib/graphql-hooks/program'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { PageHeading } from '@repo/ui/page-heading'
import { Callout } from '@/components/shared/callout/callout'
import ProgramsCreate from '../create/programs-page'
import { PROGRAM_DOCS_URL } from '@/constants/docs'
import { ProgramSettingsAssignUserDialog } from '../[id]/settings/users/program-settings-assign-user-dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { ProgramsDashboardSkeleton } from '../skeleton/programs-dashboard-skeleton'
import { PROGRAMS_LIST_HREF, PROGRAMS_VIEW_ALL, PROGRAMS_VIEW_PARAM } from '@/constants/programs'
import { useSession } from 'next-auth/react'

const ProgramsDashboardPage = () => {
  const [search, setSearch] = useState('')
  const { data: session } = useSession()
  const [expanded, setExpanded] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const { data: orgPermission } = useOrganizationRoles()
  const { setCrumbs } = use(BreadcrumbContext)
  const router = useRouter()
  const searchParams = useSearchParams()
  const showAll = searchParams.get(PROGRAMS_VIEW_PARAM) === PROGRAMS_VIEW_ALL

  const where: ProgramWhereInput = filterStatus === 'ACTIVE' ? { statusNEQ: ProgramProgramStatus.ARCHIVED } : { status: ProgramProgramStatus.ARCHIVED }

  const { data, isSuccess, isLoading } = useGetProgramDashboard({ where })

  const singleProgramId = !showAll && !search && filterStatus === 'ACTIVE' && isSuccess && data?.programs.edges?.length === 1 ? data.programs.edges[0]?.node?.id : undefined

  useEffect(() => {
    if (singleProgramId) router.replace(`/programs/${singleProgramId}`)
  }, [singleProgramId, router])

  const programIds = (data?.programs.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? []
  const hasData = !!data?.programs?.edges && data.programs.edges.length > 0

  const { data: permission } = useAccountRolesMany({
    objectType: ObjectTypes.PROGRAM,
    ids: programIds,
    enabled: hasData,
  })

  const grouped = useMemo(() => {
    const groups: Record<string, Program[]> = {}

    data?.programs?.edges?.forEach((e) => {
      const node = e?.node
      if (!node) return

      const key = node.frameworkName || 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(node)
    })

    return groups
  }, [data])

  const filteredGroups = useMemo(() => {
    const clone: Record<string, Program[]> = {}
    const q = search.toLowerCase()

    Object.keys(grouped).forEach((key) => {
      clone[key] = grouped[key].filter((p): p is Program => {
        if (!p) return false
        return (p.name?.toLowerCase().includes(q) ?? false) || (p.frameworkName?.toLowerCase().includes(q) ?? false) || (p.description?.toLowerCase().includes(q) ?? false)
      })
    })

    return clone
  }, [grouped, search])

  const allKeys = useMemo(() => Object.keys(filteredGroups), [filteredGroups])

  useEffect(() => {
    if (allKeys.length > 0) setExpanded(allKeys)

    return () => {}
  }, [allKeys])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Compliance', href: PROGRAMS_LIST_HREF },
      { label: 'Programs', href: PROGRAMS_LIST_HREF },
    ])
  }, [setCrumbs])

  if (isLoading || singleProgramId) {
    return <ProgramsDashboardSkeleton />
  }

  if (!data?.programs.edges?.length && isSuccess && !search && filterStatus === 'ACTIVE') {
    return (
      <>
        <PageHeading heading="Programs" />

        <div className="max-w-5xl mx-auto">
          <Callout variant="info" title="What is a Program?">
            Within Openlane, Programs are a centerpiece for managing compliance and regulatory requirements. Think of a program as a large, high-level grouping of work; it represents a significant
            body of work that can be broken down into smaller, more manageable tasks. Essentially, it’s a big picture initiative that can span months or possibly a year+, and can encompass work across
            different teams.
            <a href={`${PROGRAM_DOCS_URL}`} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500">
              See docs to learn more.
            </a>
          </Callout>
          {hasPermission(orgPermission?.roles, AccessEnum.CanCreateProgram, session) ? (
            <ProgramsCreate disableHeader={true} noPrograms={true} />
          ) : (
            <Callout variant="warning" className="max-w-6xl mx-33 mt-10" title="You do not have permission to create a program">
              Reach out to an organization admin to create a program on your behalf or request access for program creation
            </Callout>
          )}
        </div>
      </>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center  gap-4 flex-wrap">
        <div className="flex items-center gap-6 ">
          <h2 className="text-header text-2xl">Programs</h2>
          <div className="flex items-center gap-2">
            <Switch
              checked={expanded.length === allKeys.length && allKeys.length > 0}
              onCheckedChange={(checked) => {
                setExpanded(checked ? allKeys : [])
              }}
            />
            <label className="text-sm">Expand all</label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-between">
            <Input icon={<SearchIcon size={16} />} placeholder="Search" value={search} onChange={(event) => setSearch(event.currentTarget.value)} variant="searchTable" />{' '}
          </div>
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'ARCHIVED' | 'ACTIVE')} className="space-y-4 ">
            <TabsList className="size-fit min-w-[18px]">
              <TabsTrigger value="ACTIVE" className="whitespace-nowrap">
                Active Programs
              </TabsTrigger>
              <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
          {hasPermission(orgPermission?.roles, AccessEnum.CanCreateProgram, session) && (
            <Link href="/programs/create">
              <Button icon={<SquarePlus />} iconPosition="left">
                Create
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isSuccess && !data?.programs.edges?.length ? (
        <p className="text-text-informational mt-10 text-center">No data</p>
      ) : (
        <Accordion type="multiple" value={expanded} className="space-y-2">
          {allKeys.sort().map((framework, i) => {
            const programs = filteredGroups[framework]
            if (!programs.length) return null

            return (
              <AccordionItem key={framework} value={framework} className={clsx('border-b w-full  m-0', i > 0 ? 'py-8' : 'pb-8')}>
                <AccordionTrigger
                  onClick={() => {
                    if (expanded.includes(framework)) {
                      setExpanded((prev) => prev.filter((item) => item !== framework))
                      return
                    }
                    setExpanded((prev) => [...prev, framework])
                  }}
                  className="group flex items-center bg-transparent"
                >
                  <ChevronRight size={20} className="mr-2 text-brand transition-transform group-data-[state=open]:rotate-90" />
                  <span className="text-lg">{framework}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-4 mt-4">{programs.map((p) => p && <ProgramCard key={p.id} program={p} editAllowed={canEdit(permission?.object_roles[p.id], session)} />)}</div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}

export default ProgramsDashboardPage

const ProgramCard = ({ program, editAllowed }: { program: NonNullable<Program>; editAllowed: boolean }) => {
  const evidencePct = Math.round((program.submittedEvidences.totalCount / program.controls.totalCount) * 100) || 0

  const openTasks = program?.tasks?.edges?.filter((t) => t?.node?.status && [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW].includes(t.node.status)).length ?? 0
  const status = program.status === ProgramProgramStatus.READY_FOR_AUDITOR ? ProgramProgramStatus.IN_PROGRESS : program.status
  const isArchived = status === ProgramProgramStatus.ARCHIVED
  const showArchiveSuggestion = editAllowed && !isArchived && program.status === ProgramProgramStatus.COMPLETED && isPastDate(program.endDate)

  const { mutateAsync: updateProgram, isPending: isUpdatingStatus } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()

  const ownerDisplayName = program.programOwner?.displayName

  const renderDates = () => {
    const hasBothDates = !!program.startDate && !!program.endDate

    if (hasBothDates) {
      return (
        <p>
          {formatDate(program.startDate)} → {formatDate(program.endDate)}
        </p>
      )
    }

    if (program.endDate) {
      return <p>→ {formatDate(program.endDate)}</p>
    }

    if (program.startDate) {
      return <p>{formatDate(program.startDate)} → Ongoing</p>
    }
  }

  const handleStatusChange = async (status: ProgramProgramStatus, successTitle: string) => {
    try {
      await updateProgram({ updateProgramId: program.id, input: { status } })
      successNotification({ title: successTitle })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleUnarchive = () => handleStatusChange(ProgramProgramStatus.IN_PROGRESS, 'The program has been successfully unarchived.')
  const handleArchive = () => handleStatusChange(ProgramProgramStatus.ARCHIVED, 'The program has been successfully archived.')

  return (
    <Card className="p-6 gap-6  flex flex-col ">
      <div className="flex justify-between items-center">
        <div className="font-medium flex items-center gap-3">
          <StandardsIconMapper height={30} width={30} shortName={program.frameworkName ?? ''}></StandardsIconMapper>
          {program.name}
          {program.status === ProgramProgramStatus.READY_FOR_AUDITOR && <Badge variant={'green'}>Ready For Auditor</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {isArchived ? (
            <Button icon={<Undo />} variant="secondary" iconPosition="left" aria-label="Unarchive program" onClick={handleUnarchive} disabled={isUpdatingStatus}>
              {isUpdatingStatus ? 'Unarchiving...' : 'Unarchive'}
            </Button>
          ) : (
            <>
              {editAllowed && (
                <ProgramSettingsAssignUserDialog
                  id={program.id}
                  trigger={
                    <Button variant="secondary" aria-label="Assign users to program">
                      <UserRoundPlus className="size-4" />
                    </Button>
                  }
                />
              )}

              <Menu content={<ProgramSettingsIconBtn programId={program.id} />} />
            </>
          )}
        </div>
      </div>

      {showArchiveSuggestion && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="size-5 shrink-0 text-[var(--color-warning)]" />
            <div className="text-sm">
              <p className="font-medium">This program is completed and past its end date</p>
              <p className="text-muted-foreground">To keep your workspace organized, we recommend archiving it</p>
            </div>
          </div>
          <Button variant="secondary" className="shrink-0 border-[var(--color-warning)]/60 " onClick={handleArchive} disabled={isUpdatingStatus} aria-label="Archive program">
            {isUpdatingStatus ? 'Archiving...' : 'Archive Program'}
          </Button>
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center gap-3 text-sm ">
        <div className="flex items-center gap-2">
          {ProgramIconMapper[status]}
          <span className={clsx('capitalize', isArchived && 'text-muted-foreground')}>{status.replace('_', ' ').toLowerCase()}</span>
        </div>
        {(program.startDate || program.endDate) && (
          <>
            <div className="bg-inverted-muted-foreground w-0.5 h-0.5 rounded-full" />
            <div className={clsx('flex items-center gap-2', isArchived && 'text-muted-foreground')}>
              <Calendar className="size-4 " />
              {renderDates()}
            </div>
          </>
        )}
        <div className="bg-inverted-muted-foreground w-0.5 h-0.5 rounded-full" />
        <div className={clsx('flex items-center gap-2', isArchived && 'text-muted-foreground')}>
          <UserIcon className="size-4 " />
          {ownerDisplayName ?? 'Unknown'}
        </div>
      </div>

      <div className="flex items-center">
        <Metric label="EVIDENCE" value={`${evidencePct}%`} valueLabel="submitted" status={status} />
        <Separator vertical className="mx-4 w-fit" separatorClass="h-10" />
        <Metric label="TASKS" value={openTasks || 0} valueLabel="open" status={status} />
        <Separator vertical className="mx-4 w-fit" separatorClass="h-10" />
        <Metric label="CONTROLS" value={program.controls.totalCount} valueLabel="total" status={status} />
      </div>
      <Link href={`/programs/${program.id}`}>
        <Button className="w-full" variant="secondary" aria-label="View Program">
          View
        </Button>
      </Link>
    </Card>
  )
}

const Metric = ({ label, value, valueLabel, status }: { label: string; value: string | number; valueLabel: string; status: ProgramProgramStatus }) => {
  const isArchived = status === ProgramProgramStatus.ARCHIVED

  return (
    <div className="flex flex-col text-sm w-[156px]">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex gap-2 items-center">
        <span className={`text-lg ${isArchived ? 'text-muted-foreground' : ''}`}>{value}</span>
        <span className="text-muted-foreground text-sm">{valueLabel}</span>
      </div>
    </div>
  )
}
