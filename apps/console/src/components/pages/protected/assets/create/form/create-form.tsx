import React, { useState } from 'react'
import { InfoIcon } from 'lucide-react'
import useFormSchema, { CreateAssetFormatData } from '../../hooks/use-form-schema'
import { Input, InputRow } from '@repo/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Grid, GridCell, GridRow } from '@repo/ui/grid'
import { Button } from '@repo/ui/button'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { dialogStyles } from '@/components/pages/protected/programs/dialog.styles'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import HeadsUpDisplay from '@/components/shared/heads-up/heads-up'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import Link from 'next/link'
import { useGetTags } from '@/lib/graphql-hooks/tags'
import { useCreateAsset } from '@/lib/graphql-hooks/assets'
import { CreateAssetInput } from '@repo/codegen/src/schema'

type TProps = {
  onSuccess: () => void
  defaultSelectedObject?: ObjectTypeObjects
  excludeObjectTypes?: ObjectTypeObjects[]
  initialData?: TObjectAssociationMap
  objectAssociationsDisplayIDs?: string[]
}

const CreateForm: React.FC<TProps> = (props: TProps) => {
  const { formInput } = dialogStyles()
  const [tagValues, setTagValues] = useState<Option[]>([])
  const { form } = useFormSchema()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: create, isPending: isSubmitting } = useCreateAsset()
  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [associationResetTrigger, setAssociationResetTrigger] = useState(0)
  const { tagOptions } = useGetTags()

  const membersOptions = membersData?.organization?.members?.edges?.map((member) => ({
    value: member?.node?.user?.id,
    label: `${member?.node?.user?.displayName}`,
    membershipId: member?.node?.id,
  }))

  const onSubmitHandler = async (data: CreateAssetFormatData) => {
    try {
      const formData: { input: CreateAssetInput } = {
        input: {
          // TODO: Add fields here for the form
          name: data?.name,
          tags: data?.tags,
          ...associations,
        },
      }

      const res = await create(formData)

      successNotification({
        title: 'Asset Created',
        description: (
          <>
            Asset has been successfully created.{' '}
            <Link href={`/assets?id=${res.createAsset.asset.id}`} className="text-blue-600 underline">
              View Asset
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

  return (
    <div className={formInput()}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitHandler)} className="grid grid-cols-1 gap-4">
          {/* TODO: Add Form Fields */}

          {/* Name Field */}
          <InputRow className="w-full">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex items-center">
                    <FormLabel>Name</FormLabel>
                    <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a brief, descriptive name to help easily identify the asset later.</p>} />
                  </div>
                  <FormControl>
                    <Input variant="medium" {...field} className="w-full" />
                  </FormControl>
                  {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
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
        </form>
      </Form>

      <Button variant="primary" onClick={form.handleSubmit(onSubmitHandler)} loading={isSubmitting} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Create Asset'}
      </Button>
    </div>
  )
}

export default CreateForm
