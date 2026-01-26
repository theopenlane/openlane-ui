import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { useGetStandards } from '@/lib/graphql-hooks/standards'
import { Standard } from '@repo/codegen/src/schema'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { useFormContext, useWatch, useController } from 'react-hook-form'
import { useMemo } from 'react'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'

const StandardSelect = () => {
  const { control, setValue, trigger } = useFormContext()
  const programKindName = useWatch({ control, name: 'programKindName' })
  const { field } = useController({ name: 'framework', control })

  const { data } = useGetStandards({})
  const frameworks = useMemo(() => data?.standards?.edges?.map((e) => e?.node as Standard).filter(Boolean) ?? [], [data])

  const options = useMemo(
    () =>
      frameworks.map((f) => ({
        label: `${f.shortName}${f.version ? ` (${f.version})` : ''}`,
        value: f.shortName ?? '',
      })),
    [frameworks],
  )

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'program',
      field: 'kind',
    },
  })

  const currentYear = new Date().getFullYear()

  return (
    <FormField
      control={control}
      name="framework"
      render={() => (
        <FormItem>
          <FormControl>
            <SearchableSingleSelect
              className="w-full"
              value={field.value ?? ''}
              options={options}
              placeholder="Select a framework"
              onChange={(value) => {
                const selected = frameworks.find((f) => f.shortName === value)
                field.onChange(value)
                const selectedLabel = enumOptions.find((t) => t.value === programKindName)?.label
                const autoName = programKindName === 'Gap Analysis' ? `${selectedLabel} - ${value} - ${currentYear}` : `${value} - ${currentYear}`

                setValue('name', autoName, { shouldValidate: true })
                setValue('standardID', selected?.id ?? '')
                trigger(['name', 'framework'])
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export default StandardSelect
