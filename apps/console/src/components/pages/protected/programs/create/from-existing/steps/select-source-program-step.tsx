'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Check, Hourglass, Info, Pencil, Repeat } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'
import CountBadge from '@/components/shared/count-badge/count-badge'
import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'
import { useProgramSelect } from '@/lib/graphql-hooks/program'
import { formatDate } from '@/utils/date'
import { type FrameworkControlCount, type SourceProgram, type SourceTeam } from '../from-existing-types'
import { type WizardValues } from '../from-existing-wizard-config'

type SelectSourceProgramStepProps = {
  sourceProgram?: SourceProgram
  isLoading: boolean
  controlsByFramework: FrameworkControlCount[]
  controlCount: number
  isControlsLoading: boolean
  ownerName?: string
  ownerLeftOrg: boolean
  newStartDate: Date
  newEndDate: Date
  team: SourceTeam
  isTeamLoading: boolean
}

const SelectSourceProgramStep = ({
  sourceProgram,
  isLoading,
  controlsByFramework,
  controlCount,
  isControlsLoading,
  ownerName,
  ownerLeftOrg,
  newStartDate,
  newEndDate,
  team,
  isTeamLoading,
}: SelectSourceProgramStepProps) => {
  const { control } = useFormContext<WizardValues>()
  const { programOptions } = useProgramSelect({})
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSwitchingProgram, setIsSwitchingProgram] = useState(false)
  const { enumOptions } = useGetCustomTypeEnums({ where: { objectType: objectToSnakeCase(ObjectTypes.PROGRAM), field: 'kind' } })

  const showSummary = !isLoading && !!sourceProgram
  const showProgramSelect = isSwitchingProgram || (!isLoading && !sourceProgram)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Copy an existing program</h2>
        <p className="text-sm text-muted-foreground">Pick the program you want to start from. We&apos;ll carry over its details, auditor and controls.</p>
      </div>

      {showProgramSelect && (
        <FormField
          control={control}
          name="sourceProgramID"
          render={({ field, fieldState }) => (
            <FormItem className="max-w-md">
              <FormLabel>
                Program<span className="text-destructive"> *</span>
              </FormLabel>
              <FormControl>
                <SearchableSingleSelect
                  value={field.value}
                  options={programOptions}
                  placeholder="Select a program"
                  onChange={(value) => {
                    field.onChange(value)
                    setIsSwitchingProgram(false)
                  }}
                />
              </FormControl>
              {fieldState.error && <FormMessage />}
            </FormItem>
          )}
        />
      )}

      {isLoading && (
        <div className="flex items-center gap-2">
          <Hourglass size={20} strokeWidth={1} className="text-brand" />
          <span className="text-sm text-muted-foreground">Loading program...</span>
        </div>
      )}

      {showSummary && sourceProgram && (
        <Card className="divide-y">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <FormField
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem className="space-y-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditingName ? (
                      <>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ''}
                            autoFocus
                            className="h-8 max-w-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                setIsEditingName(false)
                              }
                            }}
                          />
                        </FormControl>
                        <Button type="button" variant="secondary" size="icon-sm" className="p-0!" aria-label="Save program name" onClick={() => setIsEditingName(false)}>
                          <Check size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <h3 className="font-medium">{field.value || sourceProgram.name}</h3>
                        <Button type="button" variant="secondary" size="icon-sm" className="p-0!" aria-label="Edit program name" onClick={() => setIsEditingName(true)}>
                          <Pencil size={14} />
                        </Button>
                      </>
                    )}
                    {sourceProgram.programKindName && <CustomTypeEnumValue value={sourceProgram.programKindName} options={enumOptions ?? []} />}
                    {sourceProgram.frameworkName && <Badge variant="outline">{sourceProgram.frameworkName}</Badge>}
                  </div>
                  {fieldState.error && <FormMessage />}
                </FormItem>
              )}
            />
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline">Copied from {sourceProgram.name}</Badge>
              <Button type="button" variant="secondary" size="icon-sm" className="p-0!" aria-label="Switch program" onClick={() => setIsSwitchingProgram(true)}>
                <Repeat size={14} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 px-4 py-3">
            <div className="space-y-2">
              <SummaryRow label="New period" value={`${formatDate(newStartDate.toISOString())} - ${formatDate(newEndDate.toISOString())}`} hint="Today through one year from today" />
              <SummaryRow label="Previous period" value={sourceProgram.startDate ? `${formatDate(sourceProgram.startDate)} - ${formatDate(sourceProgram.endDate)}` : undefined} />
              <SummaryRow label="Program owner" value={ownerName} hint={ownerLeftOrg ? 'No longer in this organization, pick a new owner' : undefined} />
              <SummaryRow label="Description" value={sourceProgram.description} />
            </div>
            <div className="space-y-2">
              <SummaryRow label="Audit partner" value={sourceProgram.auditor} />
              <SummaryRow label="Audit firm" value={sourceProgram.auditFirm} />
              <SummaryRow label="Audit partner email" value={sourceProgram.auditorEmail} />
              <SummaryRow label="Users" value={isTeamLoading ? 'Loading...' : teamSummary(team)} />
              <SummaryRow label="Groups" value={isTeamLoading ? 'Loading...' : groupSummary(team)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <p className="text-sm font-medium">Controls</p>
            {isControlsLoading ? (
              <span className="text-sm text-muted-foreground">Loading...</span>
            ) : controlsByFramework.length === 0 ? (
              <span className="text-sm text-muted-foreground">This program has no controls yet.</span>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">{controlCount} total</span>
                {controlsByFramework.map((framework) => (
                  <div key={framework.framework} className="flex items-center gap-1.5">
                    <StandardChip referenceFramework={framework.framework} />
                    <CountBadge count={framework.count} />
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      )}

      {showSummary && sourceProgram && (
        <Callout variant="info" icon={<Info className="h-5 w-5 opacity-90" />} compact>
          The new program will be created using the settings above. Click <b>Continue</b> to update the name, audit period, owner, auditor, or controls, or select <b>Create</b> to keep everything as
          shown.
        </Callout>
      )}

      {showSummary && sourceProgram && ownerLeftOrg && (
        <Callout variant="warning" compact>
          {`The owner of ${sourceProgram.name} is no longer in this organization, so the new program will be created without an owner unless you pick one.`}
        </Callout>
      )}
    </div>
  )
}

const formatCount = (count: number, noun: string) => (count > 0 ? `${count} ${noun}${count === 1 ? '' : 's'}` : '')

const teamSummary = (team: SourceTeam) => [formatCount(team.admins.length, 'admin'), formatCount(team.members.length, 'member')].filter(Boolean).join(', ')

const groupSummary = (team: SourceTeam) =>
  [team.editorIDs.length > 0 ? `${team.editorIDs.length} with edit access` : '', team.viewerIDs.length > 0 ? `${team.viewerIDs.length} read only` : ''].filter(Boolean).join(', ')

const SummaryRow = ({ label, value, hint }: { label: string; value?: string | null; hint?: string }) => (
  <div className="flex items-baseline gap-3">
    <p className="w-40 shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <div className="min-w-0">
      <p className={`text-sm ${value ? '' : 'text-muted-foreground'}`}>{value || '—'}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  </div>
)

export default SelectSourceProgramStep
