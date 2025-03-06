import React from 'react'
import { TaskTypes } from '@/components/pages/protected/tasks/util/task'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { InfoIcon } from 'lucide-react'
import useFormSchema, { CreateTaskFormData } from '../../hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import { Button } from '@repo/ui/button'
import { CreateTaskInput, GetSingleOrganizationMembersQueryVariables, useCreateTaskMutation, useGetSingleOrganizationMembersQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { Textarea } from '@repo/ui/textarea'
import { useNotification } from '@/hooks/useNotification'
import ControlObjectTaskForm from '@/components/pages/protected/tasks/create-task/form/control-object-task-form'

type TProps = {
  onSuccess: () => void
}

const CreateTaskForm: React.FC<TProps> = (props: TProps) => {
  const { form } = useFormSchema()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const taskTypeOptions = Object.values(TaskTypes)
  const variables: GetSingleOrganizationMembersQueryVariables = {
    organizationId: session?.user.activeOrganizationId ?? '',
  }
  const [result, createTask] = useCreateTaskMutation()
  const [{ data: membersData }] = useGetSingleOrganizationMembersQuery({ variables })

  const membersOptions = membersData?.organization?.members
    ?.filter((member) => member.user.id != session?.user.userId)
    .map((member) => ({
      value: member.user.id,
      label: `${member.user.firstName} ${member.user.lastName}`,
      membershipId: member.id,
    }))

  const { fetching: isSubmitting } = result

  const onSubmitHandler = async (data: CreateTaskFormData) => {
    const taskObjects = data?.taskObjects?.reduce(
      (acc, item) => {
        acc[item.inputName] = item.objectIds
        return acc
      },
      {} as Record<string, string[]>,
    )

    const formData = {
      input: {
        category: data?.category,
        due: data?.due,
        title: data?.title,
        description: data?.description,
        assigneeID: data?.assigneeID,
        ...taskObjects,
      } as CreateTaskInput,
    }

    const response = await createTask(formData)

    if (response.error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the task. Please try again.',
      })
      return
    }

    successNotification({
      title: 'Task Created',
      description: `Task has been successfully created`,
    })
    form.reset()
    props.onSuccess()
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
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Test123</p>} />
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
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Test1</p>} />
                            </div>
                            <FormControl>
                              <Input variant="medium" {...field} className="w-full" />
                            </FormControl>
                            {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                          </FormItem>
                        )}
                      />
                    </InputRow>

                    {/* Description Field */}
                    <InputRow className="w-full">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <div className="flex items-center">
                              <FormLabel>Description</FormLabel>
                              <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Test3</p>} />
                            </div>
                            <FormControl>
                              <Textarea id="description" {...field} className="w-full" />
                            </FormControl>
                            {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
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
                              <SystemTooltip
                                icon={<InfoIcon size={14} className="mx-1 mt-1" />}
                                content={<p>The date the evidence was collected, generally the current date but can be adjusted.</p>}
                              />
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
