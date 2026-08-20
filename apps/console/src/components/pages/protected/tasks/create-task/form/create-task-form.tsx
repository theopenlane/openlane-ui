import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { InfoIcon } from 'lucide-react'
import useFormSchema, { type CreateTaskFormData } from '../../hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import { Button } from '@repo/ui/button'
import { Switch } from '@repo/ui/switch'
import { type CreateTaskInput } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { CalendarPopover } from '@repo/ui/calendar-popover'
import { useNotification } from '@/hooks/useNotification'
import { useCreateTask } from '@/lib/graphql-hooks/task'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { dialogStyles } from '@/components/pages/protected/programs/dialog.styles'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import HeadsUpDisplay from '@/components/shared/heads-up/heads-up'
import { isAssociationItemSelected, removeAssociationItem, type TAssociationItem } from '@/components/shared/object-association/association-items'
import { hasAssociationChanges } from '@/components/shared/object-association/utils'
import { type Value } from 'platejs'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'

type TSubmitAction = 'save' | 'saveAndUse'

type TProps = {
  onSuccess: () => void
  onSuccessWithId?: (id: string) => void
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  objectAssociationItems?: TAssociationItem[]
  initialValues?: Partial<CreateTaskFormData>
  hideObjectAssociation?: boolean
  isOpen?: boolean
  fromTemplate?: boolean
}

const CreateTaskForm: React.FC<TProps> = (props: TProps) => {
  const plateEditorHelper = usePlateEditor()
  const { formInput } = dialogStyles()
  const { form } = useFormSchema(props.initialValues)
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const openObjectSheet = useOpenObjectSheet()
  const { mutateAsync: createTask, isPending: isSubmitting } = useCreateTask()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })

  const { tagOptions } = useGetTags()

  const initialAssociations = React.useMemo(() => props.initialData ?? {}, [props.initialData])
  const [associations, setAssociations] = useState<TObjectAssociationMap>(initialAssociations)
  const [associationSeed, setAssociationSeed] = useState<TObjectAssociationMap>(initialAssociations)
  const appliedInitialAssociationsRef = React.useRef<TObjectAssociationMap | null>(null)
  const [associationResetTrigger, setAssociationResetTrigger] = useState(0)
  const [submittingAction, setSubmittingAction] = useState<TSubmitAction | null>(null)
  const isTemplate = !props.fromTemplate && !!form.watch('isTemplate')

  const { enumOptions: taskKindOptions, onCreateOption: createTaskKind } = useCreatableEnumOptions({
    objectType: 'task',
    field: 'kind',
  })

  const headsUpItems = React.useMemo(() => (props.objectAssociationItems ?? []).filter((item) => isAssociationItemSelected(associations, item)), [props.objectAssociationItems, associations])

  const seedAssociations = (next: TObjectAssociationMap) => {
    setAssociationSeed(next)
    setAssociations(next)
  }

  const handleRemoveAssociationItem = (item: TAssociationItem) => seedAssociations(removeAssociationItem(associations, item))

  const resetAssociations = () => {
    seedAssociations(initialAssociations)
    setAssociationResetTrigger((prev) => prev + 1)
  }

  const tagValues: Option[] = React.useMemo(() => {
    if (!props.isOpen || !props.initialValues) return []
    return (props.initialValues.tags ?? []).map((tag) => ({ value: tag, label: tag }))
  }, [props.initialValues, props.isOpen])

  useEffect(() => {
    if (!props.isOpen || !props.initialValues) return

    if (props.initialValues.details) {
      form.setValue('details', props.initialValues.details)
    }
  }, [form, props.initialValues, props.isOpen])

  useEffect(() => {
    if (appliedInitialAssociationsRef.current && !hasAssociationChanges(appliedInitialAssociationsRef.current, initialAssociations)) return

    appliedInitialAssociationsRef.current = initialAssociations
    setAssociationSeed(initialAssociations)
    setAssociations(initialAssociations)
  }, [initialAssociations])

  const membersOptions = membersData?.organization?.members?.edges?.map((member) => ({
    value: member?.node?.user?.id,
    label: `${member?.node?.user?.displayName}`,
    membershipId: member?.node?.id,
  }))

  const onSubmitHandler = async (data: CreateTaskFormData, action: TSubmitAction) => {
    setSubmittingAction(action)

    try {
      let detailsField: string = ''

      if (data?.details) {
        detailsField = await plateEditorHelper.convertToHtml(data.details as Value)
      }

      const input: CreateTaskInput = {
        taskKindName: data?.taskKindName,
        due: data?.due ? new Date(data.due).toISOString() : undefined,
        title: data?.title,
        details: detailsField,
        assigneeID: data?.assigneeID,
        tags: data?.tags,
        isTemplate: data?.isTemplate,
        ...associations,
      }

      const res = await createTask({ input })
      let createdId = res.createTask.task.id

      if (action === 'saveAndUse') {
        const usedRes = await createTask({ input: { ...input, isTemplate: false } })
        createdId = usedRes.createTask.task.id
      }

      const savedTemplateOnly = action === 'save' && !!data.isTemplate

      successNotification({
        title: savedTemplateOnly ? 'Template Created' : 'Task Created',
        description: (
          <>
            {savedTemplateOnly ? 'Template has been successfully created.' : 'Task has been successfully created.'}{' '}
            <ObjectSheetLink id={createdId} kind={ObjectAssociationNodeEnum.TASK} label={savedTemplateOnly ? 'View Template' : 'View Task'} onOpenSheet={openObjectSheet} />
          </>
        ),
      })

      form.reset()
      resetAssociations()
      props.onSuccessWithId?.(createdId)
      props.onSuccess()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setSubmittingAction(null)
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
            <div className={props.hideObjectAssociation ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-4'}>
              <div className="col-span-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => onSubmitHandler(data, 'save'))} className="grid grid-cols-1 gap-4">
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
                            <FormControl>
                              <CreatableCustomTypeEnumSelect
                                value={field.value}
                                options={taskKindOptions}
                                onValueChange={field.onChange}
                                onCreateOption={createTaskKind}
                                placeholder="Select"
                                searchPlaceholder="Search task type..."
                              />
                            </FormControl>
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
                            <PlateEditor onChange={handleDetailsChange} placeholder="Write your task details" initialValue={props.initialValues?.details} />
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

                    {!props.fromTemplate && (
                      <InputRow className="w-full border-t pt-4">
                        <FormField
                          control={form.control}
                          name="isTemplate"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Switch checked={!!field.value} onCheckedChange={field.onChange} aria-label="This is a template" />
                                </FormControl>
                                <FormLabel>This is a template</FormLabel>
                              </div>
                              {field.value && <p className="text-sm text-muted-foreground">Templates can be reused to quickly create tasks later.</p>}
                            </FormItem>
                          )}
                        />
                      </InputRow>
                    )}
                  </form>
                </Form>
              </div>
              {!props.hideObjectAssociation && (
                <div className="col-span-1">
                  <Panel>
                    <PanelHeader heading="Object association" noBorder />
                    <p>Associating objects will allow users with access to the object to see the created task.</p>
                    {headsUpItems.length > 0 && (
                      <HeadsUpDisplay
                        subject="task"
                        descriptionText="The task you are creating will automatically be linked to the objects below. We pre-selected them for you — remove any you do not need."
                        items={headsUpItems}
                        onRemove={handleRemoveAssociationItem}
                      />
                    )}
                    <ObjectAssociation
                      key={associationResetTrigger}
                      defaultSelectedObject={props.defaultSelectedObject}
                      allowedObjectTypes={props.allowedObjectTypes}
                      initialData={associationSeed}
                      onIdChange={setAssociations}
                    />
                  </Panel>
                </div>
              )}
            </div>
          </GridCell>
        </GridRow>

        <GridRow columns={1}>
          <GridCell className="flex gap-2">
            {isTemplate ? (
              <>
                <Button variant="secondary" onClick={form.handleSubmit((data) => onSubmitHandler(data, 'save'))} loading={submittingAction === 'save'} disabled={isSubmitting}>
                  Save as template
                </Button>
                <Button variant="primary" onClick={form.handleSubmit((data) => onSubmitHandler(data, 'saveAndUse'))} loading={submittingAction === 'saveAndUse'} disabled={isSubmitting}>
                  Save as template and use
                </Button>
              </>
            ) : (
              <Button variant="primary" onClick={form.handleSubmit((data) => onSubmitHandler(data, 'save'))} loading={isSubmitting} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Create task'}
              </Button>
            )}
          </GridCell>
        </GridRow>
      </Grid>
    </div>
  )
}

export default CreateTaskForm
