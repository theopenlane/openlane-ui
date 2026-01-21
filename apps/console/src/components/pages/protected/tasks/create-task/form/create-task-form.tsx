import React, { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { InfoIcon } from 'lucide-react'
import useFormSchema, { CreateTaskFormData } from '../../hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import { Button } from '@repo/ui/button'
import { CreateTaskInput } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useNotification } from '@/hooks/useNotification'
import { useCreateTask } from '@/lib/graphql-hooks/tasks'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { dialogStyles } from '@/components/pages/protected/programs/dialog.styles'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import HeadsUpDisplay from '@/components/shared/heads-up/heads-up'
import { Value } from 'platejs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Link from 'next/link'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import CustomTypeEnumChip from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

type TProps = {
  onSuccess: () => void
  defaultSelectedObject?: ObjectTypeObjects
  excludeObjectTypes?: ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}

const CreateTaskForm: React.FC<TProps> = (props: TProps) => {
  const plateEditorHelper = usePlateEditor()
  const { formInput } = dialogStyles()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const { form } = useFormSchema()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createTask, isPending: isSubmitting } = useCreateTask()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [associationResetTrigger, setAssociationResetTrigger] = useState(0)
  const { tagOptions } = useGetTags()

  const { enumOptions: taskKindOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'task',
      field: 'kind',
    },
  })

  const membersOptions = membersData?.organization?.members?.edges?.map((member) => ({
    value: member?.node?.user?.id,
    label: `${member?.node?.user?.displayName}`,
    membershipId: member?.node?.id,
  }))

  const onSubmitHandler = async (data: CreateTaskFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await plateEditorHelper.convertToHtml(detailsField as Value)
      }

      const formData: { input: CreateTaskInput } = {
        input: {
          taskKindName: data?.taskKindName,
          due: data?.due,
          title: data?.title,
          details: detailsField,
          assigneeID: data?.assigneeID,
          tags: data?.tags,
          ...associations,
        },
      }

      const res = await createTask(formData)

      successNotification({
        title: 'Task Created',
        description: (
          <>
            Task has been successfully created.{' '}
            <Link href={`/tasks?id=${res.createTask.task.id}`} className="text-blue-600 underline">
              View Task
            </Link>
          </>
        ),
      })

      form.reset()
      props.onSuccess()
      setAssociationResetTrigger((prev) => prev + 1)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDetailsChange = (value: Value) => {
    form.setValue('details', value)
  }

  return (
    <div className={formInput()}>
      <Grid>
        <GridRow columns={4}>
          <GridCell className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 gap-4">
                    {/* Category Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="taskKindName"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <div className="flex items-center">
                              <FormLabel>Type</FormLabel>
                              <SystemTooltip
                                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                                content={<p>Select a category for the task, such as evidence collection, policy review, risk review, or other.</p>}
                              />
                            </div>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className=" w-full">{field.value || 'Select'}</SelectTrigger>
                              <SelectContent>
                                {taskKindOptions.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    <CustomTypeEnumChip option={o} />
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.taskKindName && <p className="text-red-500 text-sm">{form.formState.errors.taskKindName.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* Title Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <div className="flex items-center">
                              <FormLabel>Title</FormLabel>
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive title to help easily identify the task later.</p>} />
                            </div>
                            <FormControl>
                              <Input variant="medium" {...field} className="w-full" />
                            </FormControl>
                            {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* details Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="details"
                        render={() => (
                          <FormItem className="w-full">
                            <div className="flex items-center">
                              <FormLabel>Details</FormLabel>
                              <SystemTooltip
                                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                                content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                              />
                            </div>
                            <PlateEditor onChange={handleDetailsChange} placeholder="Write your task details" />
                            {form.formState.errors.details && <p className="text-red-500 text-sm">{form.formState.errors?.details?.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* Tags Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Tags</FormLabel>
                            <FormControl>
                              <MultipleSelector
                                options={tagOptions}
                                placeholder="Add tag..."
                                creatable
                                value={tagValues}
                                onChange={(selectedOptions) => {
                                  const options = selectedOptions.map((option) => option.value)
                                  field.onChange(options)
                                  setTagValues(
                                    selectedOptions.map((item) => {
                                      return {
                                        value: item.value,
                                        label: item.label,
                                      }
                                    }),
                                  )
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            {form.formState.errors.tags && <p className="text-red-500 text-sm">{form.formState.errors.tags.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* Assign team member Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="assigneeID"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <div className="flex items-center">
                              <FormLabel>Assign team member</FormLabel>
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Test123</p>} />
                            </div>
                            <Select
                              value={field.value || 'unassigned'}
                              onValueChange={(value) => {
                                field.onChange(value === 'unassigned' ? null : value || undefined)
                              }}
                            >
                              <SelectTrigger className=" w-full">{(membersOptions || []).find((member) => member.value === field.value)?.label || 'Select'}</SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Not Assigned</SelectItem>
                                {membersOptions &&
                                  membersOptions.length > 0 &&
                                  membersOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value as string}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.assigneeID && <p className="text-red-500 text-sm">{form.formState.errors.assigneeID.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* Due Date Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="due"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel className="mb-2 flex items-center">
                              Due date
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Set the deadline by which the task must be completed.</p>} />
                            </FormLabel>
                            <CalendarPopover field={field} disabledFrom={new Date()} />
                            {form.formState.errors.due && <p className="text-red-500 text-sm">{form.formState.errors.due.message as string}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>
                  </form>
                </Form>
              </div>
              <div className="col-span-1">
                <Panel>
                  <PanelHeader heading="Object association" noBorder />
                  <p>Associating objects will allow users with access to the object to see the created task.</p>
                  {props.objectAssociationsDisplayIDs && (
                    <HeadsUpDisplay
                      accordionLabel={'Show programs linked to this task'}
                      descriptionText={'This requested task you are creating will be automatically linked to the associated task. We have pre-selected the object association below'}
                      displayIDs={props.objectAssociationsDisplayIDs}
                    ></HeadsUpDisplay>
                  )}
                  <ObjectAssociation
                    key={associationResetTrigger}
                    defaultSelectedObject={props.defaultSelectedObject}
                    excludeObjectTypes={props.excludeObjectTypes}
                    initialData={props.initialData}
                    onIdChange={(updatedMap) => setAssociations(updatedMap)}
                  />
                </Panel>
              </div>
            </div>
          </GridCell>
        </GridRow>

        <GridRow columns={1}>
          <GridCell>
            <Button variant="primary" onClick={form.handleSubmit(onSubmitHandler)} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Create task'}
            </Button>
          </GridCell>
        </GridRow>
      </Grid>
    </div>
  )
}

export default CreateTaskForm
