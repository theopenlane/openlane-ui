'use client'

import React, { Fragment, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Button } from '@repo/ui/button'
import { PencilIcon, XIcon, SaveIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { User } from '@repo/codegen/src/schema'
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form'
import { Value } from '@udecode/plate-common'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { Input } from '@repo/ui/input'
import ControlEvidenceTable from './control-evidence-table'
import SubcontrolsTable from './subcontrols-table'
import AssociatedObjectsAccordion from './associated-objects-accordion'

type FormValues = {
  title: string
  description: Value
}

const Page: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, isError } = useGetControlById(id)
  const [isEditing, setIsEditing] = useState(false)

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

  const { category, subcategory, status, mappedCategories, owner, delegate } = data.control
  const ownerUsers = owner?.users || []
  const delegateUsers = delegate?.users || []

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <TitleField isEditing={isEditing} />
          </div>
          <DescriptionField isEditing={isEditing} />
          <ControlEvidenceTable />
          <SubcontrolsTable />
          <AssociatedObjectsAccordion />
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
                <span className="text-muted-foreground">Owner</span>
                <div className="flex gap-2">
                  {ownerUsers.map((user, i) => (
                    <Fragment key={i}>
                      <Avatar entity={user as User} variant="small" />
                      <span>{`${user.firstName ?? ''} ${user.lastName ?? ''}`}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
              {delegateUsers.length > 0 && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Delegate</span>
                  <div className="flex gap-2">
                    {delegateUsers.map((user, i) => (
                      <Fragment key={i}>
                        <Avatar entity={user} variant="small" />
                        <span>{`${user.firstName ?? ''} ${user.lastName ?? ''}`}</span>
                      </Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-medium mb-2">Properties</h3>
            <div className="space-y-2">
              <Property label="Category" value={category} />
              <Property label="Subcategory" value={subcategory} />
              <Property label="Status" value={status} />
              <Property label="Mapped categories" value={(mappedCategories ?? []).join(', ')} multiline />
            </div>
          </Card>
        </div>
      </form>
    </FormProvider>
  )
}

export default Page

const Property = ({ label, value, multiline = false }: { label: string; value?: string; multiline?: boolean }) => (
  <div className="flex items-start justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={`text-right ${multiline ? 'whitespace-pre-wrap max-w-[180px]' : ''}`}>{value || '-'}</span>
  </div>
)

type Props = {
  isEditing: boolean
}

const TitleField: React.FC<Props> = ({ isEditing }) => {
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

const DescriptionField: React.FC<Props> = ({ isEditing }) => {
  const { control, getValues } = useFormContext()

  return isEditing ? (
    <div className="w-full">
      <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
        Policy
      </label>
      <Controller control={control} name="description" render={({ field }) => <PlateEditor id="description" value={field.value as Value} onChange={field.onChange} variant="basic" />} />
    </div>
  ) : (
    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
      {/* Replace this with a read-only Plate viewer if needed */}
      {JSON.stringify(getValues('description'), null, 2)}
    </p>
  )
}
