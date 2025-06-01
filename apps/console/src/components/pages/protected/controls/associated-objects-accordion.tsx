'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Button } from '@repo/ui/button'
import { ChevronDown, ChevronsDownUp, List } from 'lucide-react'
import { SetObjectAssociationDialog } from './set-object-association-modal'
import { ControlDetailsFieldsFragment, Group, InternalPolicy, InternalPolicyEdge, Organization, Procedure, ProcedureEdge, Program, ProgramProgramStatus, Task, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { PROGRAM_STATUS_LABELS } from '@/components/shared/icon-enum/program-enum'

type AssociatedObjectsAccordionProps = {
  policies: ControlDetailsFieldsFragment['internalPolicies']
  procedures: ControlDetailsFieldsFragment['procedures']
  tasks: ControlDetailsFieldsFragment['tasks']
  programs?: ControlDetailsFieldsFragment['programs']
  risks: ControlDetailsFieldsFragment['risks']
  canEdit?: boolean
}

type PolicyOrProcedure = {
  id: string
  name: string
  approver?: {
    __typename?: 'Group'
    gravatarLogoURL?: string | null
    logoURL?: string | null
    displayName: string
  } | null
}

const AssociatedObjectsAccordion: React.FC<AssociatedObjectsAccordionProps> = ({ policies, procedures, tasks, programs, risks, canEdit }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['policies'])

  const toggleAll = () => {
    const allSections = ['policies', 'procedures', 'tasks', 'programs', 'risks']
    const hasAllExpanded = allSections.every((section) => expandedItems.includes(section))
    setExpandedItems(hasAllExpanded ? [] : allSections)
  }

  const extractNodes = <T extends { id: string }>(edges: Array<{ node?: T | null } | null> | null | undefined): T[] => {
    return (edges ?? []).map((edge) => edge?.node).filter((node): node is T => !!node)
  }

  const SectionTrigger = ({ label, count }: { label: string; count: number }) => (
    <AccordionTrigger asChild>
      <button className="group flex items-center py-2 text-left gap-3 w-full">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0" />
          <span className="text-base font-medium">{label}</span>
        </div>
        <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{count}</span>
      </button>
    </AccordionTrigger>
  )

  const renderPoliciesOrProcedures = (rows: PolicyOrProcedure[], type: 'policies' | 'procedures') => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">Name</TableHead>
            <TableHead className="px-4 py-2">Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="px-4 py-2 ">
                  <Link href={getHrefForObjectType(type, item)} className="text-blue-500 hover:underline">
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-2 flex items-center gap-2">
                  {item.approver ? (
                    <>
                      <Avatar entity={item.approver as Group} />
                      <span className="mt-1">{item.approver?.displayName || '-'}</span>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="px-4 py-2 text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderTasks = (rows: Task[]) => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">Title</TableHead>
            <TableHead className="px-4 py-2">Description</TableHead>
            <TableHead className="px-4 py-2">Assignee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="px-4 py-2 whitespace-nowrap">
                  <Link href={getHrefForObjectType('tasks', task)} className="text-blue-500 hover:underline">
                    {task.title}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-2 text-muted-foreground">
                  <p className="line-clamp-2 text-sm">{task.details}</p>
                </TableCell>
                <TableCell className="px-4 py-2 flex items-center gap-2">
                  <Avatar entity={task.assignee as User} />
                  <span className="whitespace-nowrap mt-1">{task.assignee?.displayName || '-'}</span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="px-4 py-2 text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderPrograms = (rows: Program[]) => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">Name</TableHead>
            <TableHead className="px-4 py-2">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((program) => (
              <TableRow key={program.id}>
                <TableCell className="px-4 py-2 whitespace-nowrap">
                  <Link href={getHrefForObjectType('programs', program)} className="text-blue-500 hover:underline">
                    {program.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-2">{PROGRAM_STATUS_LABELS[program.status] || program.status}</TableCell>{' '}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="px-4 py-2 text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  const renderRisks = (rows: any[]) => (
    <div className="mt-4 rounded-md border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">Name</TableHead>
            <TableHead className="px-4 py-2">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((risk) => (
              <TableRow key={risk.id}>
                <TableCell className="px-4 py-2">
                  <Link href={getHrefForObjectType('risks', risk)} className="text-blue-500 hover:underline">
                    {risk.name}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-2 text-muted-foreground">
                  <p className="line-clamp-2 text-sm">{risk.details}</p>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2} className="px-4 py-2 text-muted-foreground">
                No records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="mt-10 space-y-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-lg font-semibold whitespace-nowrap">Associated Objects</h2>
        <div className="flex justify-between w-full">
          <div className="flex gap-2.5 items-center">
            {canEdit && <SetObjectAssociationDialog />}
            <Button type="button" className="h-8 !px-2" variant="outline" onClick={toggleAll}>
              <div className="flex">
                <List size={16} />
                <ChevronsDownUp size={16} />
              </div>
            </Button>
          </div>
        </div>
      </div>

      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
        <AccordionItem value="policies">
          <SectionTrigger label="Policies" count={policies.totalCount} />
          {!!policies.edges?.length && <AccordionContent>{renderPoliciesOrProcedures(extractNodes(policies.edges), 'policies')}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="procedures">
          <SectionTrigger label="Procedures" count={procedures.totalCount} />
          {!!procedures.edges?.length && <AccordionContent>{renderPoliciesOrProcedures(extractNodes(procedures.edges), 'procedures')}</AccordionContent>}
        </AccordionItem>

        <AccordionItem value="tasks">
          <SectionTrigger label="Tasks" count={tasks.totalCount} />
          {!!tasks.edges?.length && <AccordionContent>{renderTasks(extractNodes(tasks.edges) as Task[])}</AccordionContent>}
        </AccordionItem>

        {!!programs && (
          <AccordionItem value="programs">
            <SectionTrigger label="Programs" count={programs.totalCount} />
            {!!programs.edges?.length && <AccordionContent>{renderPrograms(extractNodes(programs.edges) as Program[])}</AccordionContent>}
          </AccordionItem>
        )}

        <AccordionItem value="risks">
          <SectionTrigger label="Risks" count={risks.totalCount} />
          {!!risks.edges?.length && <AccordionContent>{renderRisks(extractNodes(risks.edges))}</AccordionContent>}
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default AssociatedObjectsAccordion
