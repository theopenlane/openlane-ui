'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Group } from '@repo/codegen/src/schema'
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Input } from '@repo/ui/input'
import ControlEvidenceTable from './control-evidence-table'
import SubcontrolsTable from './subcontrols-table'
import AssociatedObjectsAccordion from './associated-objects-accordion'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'

import { PanelRightOpenIcon, FolderIcon, BinocularsIcon, PencilIcon, XIcon, SaveIcon, StampIcon, CalendarSearch, CircleUser, CircleArrowRight, CircleCheck } from 'lucide-react'

type FormValues = {
  title: string
  description: Value
}

const Page: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [activeSheet, setActiveSheet] = useState<null | string>(null)

  const form = useForm<FormValues>({
    defaultValues: { title: '', description: [] },
  })

  useEffect(() => {
    if (data?.control) {
      form.reset({
        title: data.control.refCode || '',
        description: (data.control.description as Value) || [],
      })
    }
  }, [data?.control, form])

  const onSubmit = (values: FormValues) => {
    console.log('Saving control...', values)
    // TODO: mutation
    setIsEditing(false)
  }

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>
  if (isError || !data?.control) return <div className="p-4 text-red-500">Control not found</div>

  const {
    category,
    subcategory,
    status,
    mappedCategories,
    owner,
    delegate,
    subcontrols,
    controlOwner,
    implementationGuidance,
    exampleEvidence,
    controlQuestions,
    assessmentMethods,
    assessmentObjectives,
    internalPolicies,
    procedures,
    tasks,
    programs,
  } = data.control

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'Implementation guidance':
        return (
          <div className="space-y-4">
            {implementationGuidance?.map(({ referenceId, guidance }) => (
              <div key={referenceId}>
                <h4 className="font-medium mb-1">{referenceId}</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {guidance.map((g, i) => (
                    <li key={i}>{g.trim()}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )
      case 'Example evidence':
        return <p className="text-sm text-muted-foreground">{exampleEvidence || 'No example evidence provided.'}</p>
      case 'Control questions':
        return <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">{controlQuestions?.map((q, i) => <li key={i}>{q}</li>) || 'No control questions.'}</ul>
      case 'Assessment methods':
        return <p className="text-sm text-muted-foreground">{assessmentMethods || 'No assessment methods provided.'}</p>
      case 'Assessment objectives':
        return <p className="text-sm text-muted-foreground">{assessmentObjectives || 'No assessment objectives provided.'}</p>
      default:
        return null
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
        {/* Main content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <TitleField isEditing={isEditing} />
          </div>
          <DescriptionField isEditing={isEditing} />
          <ControlEvidenceTable />
          <SubcontrolsTable subcontrols={subcontrols?.edges || []} totalCount={subcontrols.totalCount} />
          <AssociatedObjectsAccordion policies={internalPolicies} procedures={procedures} tasks={tasks} programs={programs} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {isEditing ? (
            <div className="flex gap-2">
              <Button type="submit" icon={<SaveIcon />}>
                Save
              </Button>
              <Button onClick={() => setIsEditing(false)} icon={<XIcon />}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button icon={<PencilIcon />} iconPosition="left" onClick={() => setIsEditing(true)}>
              Edit Control
            </Button>
          )}

          <Card className="p-4">
            <h3 className="text-lg font-medium mb-2">Authority</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <CircleUser size={16} className="text-brand" />
                  <span className="text-muted-foreground">Owner</span>
                </div>
                <div className="flex gap-2">
                  <Avatar entity={controlOwner as Group} variant="small" />
                  <span>{controlOwner?.displayName}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <CircleArrowRight size={16} className="text-brand" />
                  <span className="text-muted-foreground">Delegate</span>
                </div>
                <div className="flex gap-2">
                  <Avatar entity={delegate as Group} variant="small" />
                  <span>{delegate?.displayName}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-muted rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-4">Properties</h3>
            <div className="space-y-3">
              <Property label="Category" value={category} />
              <Property label="Subcategory" value={subcategory} />
              <Property label="Status" value={status} />
              <Property label="Mapped categories" value={(mappedCategories ?? []).join(',\n')} />
            </div>
          </Card>

          <Card className="p-4 bg-muted rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-4">Implementation Details</h3>
            <div className="space-y-3">
              <ImplementationDetail label="Status" value="-" />
              <ImplementationDetail
                label="Verified"
                value={
                  <div className="flex items-center gap-1 ">
                    <CircleCheck className="w-4 h-4 text-green-500" /> Yes
                  </div>
                }
              />
              <ImplementationDetail label="Verification date" value={new Date('2025-01-16').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
            </div>
          </Card>

          <Card className="p-4 bg-muted rounded-xl shadow-sm">
            <h3 className="text-lg font-medium mb-4">Info</h3>
            <div className="space-y-2">
              {['Implementation guidance', 'Example evidence', 'Control questions', 'Assessment methods', 'Assessment objectives'].map((label, i) => (
                <InfoRow key={label} label={label} isFirst={i === 0} onClick={() => setActiveSheet(label)} />
              ))}
            </div>
          </Card>
        </div>
      </form>

      <Sheet open={!!activeSheet} onOpenChange={() => setActiveSheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{activeSheet}</SheetTitle>
          </SheetHeader>
          <div className="py-4">{renderSheetContent()}</div>
        </SheetContent>
      </Sheet>
    </FormProvider>
  )
}

export default Page

// --- Component helpers ---
const iconsMap: Record<string, React.ReactNode> = {
  Category: <FolderIcon size={16} className="text-brand" />,
  Subcategory: <FolderIcon size={16} className="text-brand" />,
  Status: <BinocularsIcon size={16} className="text-brand" />,
  'Mapped categories': <FolderIcon size={16} className="text-brand" />,
}

const Property = ({ label, value }: { label: string; value?: string }) => (
  <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{iconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm whitespace-pre-line">{value || '-'}</div>
  </div>
)

const TitleField: React.FC<{ isEditing: boolean }> = ({ isEditing }) => {
  const { register, getValues } = useFormContext()
  return isEditing ? (
    <div className="w-full">
      <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
        Title<span className="text-red-500 ml-1">*</span>
      </label>
      <Input id="title" {...register('title')} />
    </div>
  ) : (
    <h1 className="text-3xl font-semibold">{getValues('title')}</h1>
  )
}

const DescriptionField: React.FC<{ isEditing: boolean }> = ({ isEditing }) => {
  const { control, getValues } = useFormContext()
  return isEditing ? (
    <div className="w-full">
      <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller control={control} name="description" render={({ field }) => <PlateEditor id="description" value={field.value as Value} onChange={field.onChange} variant="basic" />} />
    </div>
  ) : (
    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{JSON.stringify(getValues('description'), null, 2)}</p>
  )
}

const InfoRow: React.FC<{ label: string; isFirst?: boolean; onClick: () => void }> = ({ label, isFirst, onClick }) => (
  <div className={`flex items-center justify-between px-2 py-2 ${!isFirst ? 'border-t border-border' : ''}`}>
    <span className="text-sm">{label}</span>
    <Button variant="outline" icon={<PanelRightOpenIcon size={16} />} iconPosition="left" onClick={onClick}>
      Show
    </Button>
  </div>
)

const detailIconsMap: Record<string, React.ReactNode> = {
  Status: <BinocularsIcon size={16} className="text-brand" />,
  Verified: <StampIcon size={16} className="text-brand" />,
  'Verification date': <CalendarSearch size={16} className="text-brand" />,
}

const ImplementationDetail = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="grid grid-cols-[110px_1fr] items-start gap-x-3 border-b border-border pb-3 last:border-b-0">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{detailIconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm">{value || '-'}</div>
  </div>
)
