import React, { useState } from 'react'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
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
import ControlObjectTaskForm from '@/components/pages/protected/tasks/create-task/form/control-object-task-form'
import { useCreateTask } from '@/lib/graphql-hooks/tasks'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'

type TProps = {
  onSuccess: () => void
}

const CreateTaskForm: React.FC<TProps> = (props: TProps) => {
  const helper = usePlateEditor()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const { form } = useFormSchema()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const taskTypeOptions = Object.values(TaskTypes)
  const { mutateAsync: createTask, isPending: isSubmitting } = useCreateTask()
  const { data: membersData } = useGetSingleOrganizationMembers(session?.user.activeOrganizationId)

  const membersOptions = membersData?.organization?.members?.map((member) => ({
    value: member.user.id,
    label: `${member.user.firstName} ${member.user.lastName}`,
    membershipId: member.id,
  }))

  const onSubmitHandler = async (data: CreateTaskFormData) => {
    try {
      let detailsField = data?.details

      if (detailsField) {
        detailsField = await helper.convertToHtml(detailsField as Value)
      }

      const taskObjects = (data?.taskObjects || []).reduce(
        (acc, item) => {
          acc[item.inputName] = item.objectIds
          return acc
        },
        {} as Record<string, string[]>,
      )

      const formData: { input: CreateTaskInput } = {
        input: {
          category: data?.category,
          due: data?.due,
          title: data?.title,
          details: detailsField,
          assigneeID: data?.assigneeID,
          ...taskObjects,
        },
      }

      await createTask(formData)

      successNotification({
        title: 'Task Created',
        description: 'Task has been successfully created',
      })

      form.reset()
      props.onSuccess()
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the task. Please try again.',
      })
    }
  }

  return (
    <>
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
                        name="category"
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
                                {taskTypeOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {form.formState.errors.category && <p className="text-red-500 text-sm">{form.formState.errors.category.message}</p>}
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
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <div className="flex items-center">
                              <FormLabel>Details</FormLabel>
                              <SystemTooltip
                                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                                content={<p>Outline the task requirements and specific instructions for the assignee to ensure successful completion.</p>}
                              />
                            </div>
                            <FormControl>
                              <PlateEditor field={field} />
                            </FormControl>
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
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className=" w-full">{(membersOptions || []).find((member) => member.value === field.value)?.label || 'Select'}</SelectTrigger>
                              <SelectContent>
                                {membersOptions &&
                                  membersOptions.length > 0 &&
                                  membersOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
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
                            <CalendarPopover field={field} />
                            {form.formState.errors.due && <p className="text-red-500 text-sm">{form.formState.errors.due.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>
                  </form>
                </Form>
              </div>
              <div className="col-span-1">
                <ControlObjectTaskForm form={form} />
              </div>
            </div>
          </GridCell>
        </GridRow>

        <GridRow columns={1}>
          <GridCell>
            <Button onClick={form.handleSubmit(onSubmitHandler)} loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Create task'}
            </Button>
          </GridCell>
        </GridRow>
      </Grid>
    </>
  )
}

export default CreateTaskForm
