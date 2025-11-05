'use client'

import React, { useContext, useEffect, useMemo, useState } from 'react'
import { ProgramFromGetProgramDashboard as Program, useGetProgramDashboard } from '@/lib/graphql-hooks/programs'
import { Users, Calendar, ChevronRight, SquarePlus, SearchIcon, UserRoundPlus, Undo } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { formatDate } from '@/utils/date'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canCreate, canEdit } from '@/lib/authz/utils'
import Link from 'next/link'
import { ProgramProgramStatus, ProgramWhereInput, TaskTaskStatus } from '@repo/codegen/src/schema'
import { Switch } from '@repo/ui/switch'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import { ProgramIconMapper, ProgramSettingsIconBtn } from '@/components/shared/enum-mapper/program-enum'
import { Separator } from '@repo/ui/separator'
import Menu from '@/components/shared/menu/menu'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { ProgramSettingsAssignUserDialog } from '../../programs/settings/users/program-settings-assign-user-dialog'
import clsx from 'clsx'
import { useGetOrgMemberships } from '@/lib/graphql-hooks/members'
import { useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const ProgramsDashboardPage = () => {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const { data: permission, isSuccess } = useOrganizationRoles()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const where: ProgramWhereInput = filterStatus === 'ACTIVE' ? { statusNEQ: ProgramProgramStatus.ARCHIVED } : { status: ProgramProgramStatus.ARCHIVED }

  const { data } = useGetProgramDashboard({ where })

  const userIds = useMemo(() => {
    const ids = data?.programs?.edges?.map((e) => e?.node?.createdBy).filter((id): id is string => typeof id === 'string')

    return ids ? Array.from(new Set(ids)) : []
  }, [data])

  const { data: userData } = useGetOrgMemberships({
    where: {
      hasUserWith: userIds.map((id) => ({ id })),
    },
    enabled: userIds.length > 0,
  })

  const userMap = useMemo(() => {
    const map = new Map<string, string>()

    userData?.orgMemberships?.edges?.forEach((edge) => {
      const user = edge?.node?.user
      if (user?.id) {
        map.set(user.id, user.displayName)
      }
    })

    return map
  }, [userData])

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

    Object.keys(grouped).forEach((key) => {
      clone[key] = grouped[key].filter((p): p is Program => !!p && (p.id.toLowerCase().includes(search.toLowerCase()) || key.toLowerCase().includes(search.toLowerCase())))
    })

    return clone
  }, [grouped, search])

  const allKeys = useMemo(() => Object.keys(filteredGroups), [filteredGroups])

  useEffect(() => {
    if (allKeys.length > 0) setExpanded([allKeys[0]])

    return () => {}
  }, [allKeys])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Programs', href: '/programs' },
    ])
  }, [setCrumbs])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-6">
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
            <TabsList className="size-fit">
              <TabsTrigger value="ACTIVE">Active Programs</TabsTrigger>
              <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
          {canCreate(permission?.roles, AccessEnum.CanCreateProgram) && (
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
          {allKeys.sort().map((framework) => {
            const programs = filteredGroups[framework]
            if (!programs.length) return null

            return (
              <AccordionItem key={framework} value={framework} className="border-b w-full py-8 m-0">
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
                  <div className="flex flex-wrap gap-4 mt-4">{programs.map((p) => p && <ProgramCard key={p.id} program={p} userMap={userMap} />)}</div>
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

const ProgramCard = ({ program, userMap }: { program: NonNullable<Program>; userMap: Map<string, string> }) => {
  const evidencePct = program.evidence?.totalCount && program?.evidence?.edges ? Math.round((program.evidence.edges.length / program.evidence.totalCount) * 100) : 0

  const openTasks = program?.tasks?.edges?.filter((t) => t?.node?.status && [TaskTaskStatus.OPEN, TaskTaskStatus.IN_PROGRESS, TaskTaskStatus.IN_REVIEW].includes(t.node.status)).length ?? 0
  const status = program.status === ProgramProgramStatus.READY_FOR_AUDITOR ? ProgramProgramStatus.IN_PROGRESS : program.status
  const isArchived = status === ProgramProgramStatus.ARCHIVED
  const { data: permission } = useAccountRoles(ObjectEnum.PROGRAM, program.id)
  const editAllowed = canEdit(permission?.roles)

  const { mutateAsync: updateProgram, isPending: isUnarchiving } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const handleUnarchive = async () => {
    try {
      await updateProgram({
        updateProgramId: program.id,
        input: { status: ProgramProgramStatus.IN_PROGRESS },
      })

      successNotification({
        title: 'The program has been successfully unarchived.',
      })

      queryClient.invalidateQueries({ queryKey: ['programs'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Card className="p-6 gap-6  flex flex-col ">
      <div className="flex justify-between items-center">
        <div className="font-medium flex items-center gap-3">
          <StandardsIconMapper height={30} width={30} shortName={program.frameworkName ?? ''}></StandardsIconMapper>
          {program.name}
          {program.status === ProgramProgramStatus.READY_FOR_AUDITOR && <Badge>Ready For Auditor</Badge>}
        </div>
        <div className="flex items-center gap-3">
          {isArchived ? (
            <Button icon={<Undo />} variant="secondary" iconPosition="left" aria-label="Unarchive program" onClick={handleUnarchive} disabled={isUnarchiving}>
              {isUnarchiving ? 'Unarchiving...' : 'Unarchive'}
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

      {/* Status row */}
      <div className="flex items-center gap-3 text-sm ">
        <div className="flex items-center gap-2">
          {ProgramIconMapper[status]}
          <span className={clsx('capitalize', isArchived && 'text-muted-foreground')}>{status.replace('_', ' ').toLowerCase()}</span>
        </div>
        <div className="bg-inverted-muted-foreground w-0.5 h-0.5 rounded-full" />
        <div className={clsx('flex items-center gap-2', isArchived && 'text-muted-foreground')}>
          <Calendar className="size-4 " />
          {formatDate(new Date().toISOString())} → {formatDate(program.endDate)}
        </div>
        <div className="bg-inverted-muted-foreground w-0.5 h-0.5 rounded-full" />
        <div className={clsx('flex items-center gap-2', isArchived && 'text-muted-foreground')}>
          <Users className="size-4 " />
          {userMap.get(program?.createdBy ?? '') ?? 'Unknown'}
        </div>
      </div>

      <div className="flex jsutify-start items-center">
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
