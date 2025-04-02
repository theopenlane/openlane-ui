'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useForm, FormProvider } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import ControlEvidenceTable from './control-evidence-table'
import SubcontrolsTable from './subcontrols-table'
import AssociatedObjectsAccordion from './associated-objects-accordion'
import TitleField from './form-fields/title-field'
import DescriptionField from './form-fields/description-field'
import AuthorityCard from './authority-card'
import PropertiesCard from './properties-card'
import ImplementationDetailsCard from './implementation-details-card'
import InfoCard from './info-card'

interface FormValues {
  title: string
  description: Value
}

interface SheetData {
  title: string
  content: React.ReactNode
}

const ControlDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [showSheet, setShowSheet] = useState<boolean>(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)

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
    setIsEditing(false)
  }

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>
  if (isError || !data?.control) return <div className="p-4 text-red-500">Control not found</div>

  const control = data.control

  const showInfoDetails = (title: string, content: React.ReactNode) => {
    setSheetData({ title, content })
    setShowSheet(true)
  }

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setShowSheet(false)
      setTimeout(() => {
        setSheetData(null)
      }, 300)
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <TitleField isEditing={isEditing} />
          </div>
          <DescriptionField isEditing={isEditing} />
          <ControlEvidenceTable />
          <SubcontrolsTable subcontrols={control.subcontrols?.edges || []} totalCount={control.subcontrols.totalCount} />
          <AssociatedObjectsAccordion policies={control.internalPolicies} procedures={control.procedures} tasks={control.tasks} programs={control.programs} />
        </div>
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
          <AuthorityCard controlOwner={control.controlOwner} delegate={control.delegate} />
          <PropertiesCard category={control.category} subcategory={control.subcategory} status={control.status} mappedCategories={control.mappedCategories} />
          <ImplementationDetailsCard />
          <InfoCard
            implementationGuidance={control.implementationGuidance}
            exampleEvidence={control.exampleEvidence}
            controlQuestions={control.controlQuestions}
            assessmentMethods={control.assessmentMethods}
            assessmentObjectives={control.assessmentObjectives}
            showInfoDetails={showInfoDetails}
          />
        </div>
      </form>

      <Sheet open={showSheet} onOpenChange={handleSheetClose}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{sheetData?.title}</SheetTitle>
          </SheetHeader>
          <div className="py-4">{sheetData?.content}</div>
        </SheetContent>
      </Sheet>
    </FormProvider>
  )
}

export default ControlDetailsPage
