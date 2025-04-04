'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetControlById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import { useForm, FormProvider } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { PencilIcon, SaveIcon, XIcon } from 'lucide-react'
import ControlEvidenceTable from '../../../../components/pages/protected/controls/control-evidence-table.tsx'
import SubcontrolsTable from '../../../../components/pages/protected/controls/subcontrols-table.tsx'
import AssociatedObjectsAccordion from '../../../../components/pages/protected/controls/associated-objects-accordion.tsx'
import TitleField from '../../../../components/pages/protected/controls/form-fields/title-field.tsx'
import DescriptionField from '../../../../components/pages/protected/controls/form-fields/description-field.tsx'
import AuthorityCard from '../../../../components/pages/protected/controls/authority-card.tsx'
import PropertiesCard from '../../../../components/pages/protected/controls/properties-card.tsx'
import ImplementationDetailsCard from '../../../../components/pages/protected/controls/implementation-details-card.tsx'
import InfoCard from '../../../../components/pages/protected/controls/info-card.tsx'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { ControlControlStatus } from '@repo/codegen/src/schema.ts'

interface FormValues {
  refCode: string
  description: string
  delegateID: string
  controlOwnerID: string
  category?: string
  subcategory?: string
  status: ControlControlStatus
  mappedCategories: string[]
}

interface SheetData {
  refCode: string
  content: React.ReactNode
}

const initialDataObj = {
  refCode: '',
  description: '',
  delegateID: '',
  controlOwnerID: '',
  category: '',
  subcategory: '',
  status: ControlControlStatus.NULL,
  mappedCategories: [],
}

const ControlDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [showSheet, setShowSheet] = useState<boolean>(false)
  const [sheetData, setSheetData] = useState<SheetData | null>(null)

  const [initialValues, setInitialValues] = useState<FormValues>(initialDataObj)

  const { mutateAsync: updateControl } = useUpdateControl()
  const plateEditorHelper = usePlateEditor()

  const form = useForm<FormValues>({
    defaultValues: initialDataObj,
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const description = await plateEditorHelper.convertToHtml(values.description as Value | any)

      await updateControl({
        updateControlId: id!,
        input: {
          ...values,
          description,
        },
      })

      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update control:', error)
    }
  }

  const showInfoDetails = (refCode: string, content: React.ReactNode) => {
    setSheetData({ refCode, content })
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

  const handleCancel = () => {
    form.reset(initialValues)
    setIsEditing(false)
  }

  useEffect(() => {
    if (data?.control) {
      const newValues: FormValues = {
        refCode: data.control.refCode || '',
        description: data.control.description || '',
        delegateID: data.control.delegate?.id || '',
        controlOwnerID: data.control.controlOwner?.id || '',
        category: data.control.category || '',
        subcategory: data.control.subcategory || '',
        status: data.control.status || ControlControlStatus.NULL,
        mappedCategories: data.control.mappedCategories || [],
      }

      form.reset(newValues)
      setInitialValues(newValues)
    }
  }, [data?.control, form])

  if (isLoading) return <div className="p-4 text-muted-foreground">Loading...</div>
  if (isError || !data?.control) return <div className="p-4 text-red-500">Control not found</div>
  const control = data?.control

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-[1fr_336px] gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <TitleField isEditing={isEditing} />
          </div>
          <DescriptionField isEditing={isEditing} initialValue={initialValues.description} />
          <ControlEvidenceTable />
          <SubcontrolsTable subcontrols={control.subcontrols?.edges || []} totalCount={control.subcontrols.totalCount} />
          <AssociatedObjectsAccordion policies={control.internalPolicies} procedures={control.procedures} tasks={control.tasks} programs={control.programs} />
        </div>
        <div className="space-y-4">
          {isEditing ? (
            <div className="flex gap-2 justify-end">
              <Button type="button" className="h-8 !px-2" onClick={handleCancel} icon={<XIcon />}>
                Cancel
              </Button>
              <Button type="submit" iconPosition="left" className="h-8 !px-2" icon={<SaveIcon />}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button className="h-8 !px-2" icon={<PencilIcon />} iconPosition="left" onClick={() => setIsEditing(true)}>
                Edit Control
              </Button>
            </div>
          )}
          <AuthorityCard controlOwner={control.controlOwner} delegate={control.delegate} isEditing={isEditing} />
          <PropertiesCard category={control.category} subcategory={control.subcategory} status={control.status} mappedCategories={control.mappedCategories} isEditing={isEditing} />
          <ImplementationDetailsCard isEditing={isEditing} />
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
            <SheetTitle>{sheetData?.refCode}</SheetTitle>
          </SheetHeader>
          <div className="py-4">{sheetData?.content}</div>
        </SheetContent>
      </Sheet>
    </FormProvider>
  )
}

export default ControlDetailsPage
