import { SearchableSingleSelect } from '@/components/shared/searchableSingleSelect/searchable-single-select'
import { useGetStandards } from '@/lib/graphql-hooks/standard'
import { type Standard } from '@repo/codegen/src/schema'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { useFormContext, useWatch, useController } from 'react-hook-form'
import { useCallback, useEffect, useMemo } from 'react'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

type StandardSelectProps = {
  defaultFramework?: string
}

const getStandardLabel = (standard: Standard) => `${standard.shortName}${standard.version ? ` (${standard.version})` : ''}`

const normalizeFramework = (value?: string | null) => value?.trim().toLowerCase()
const PROGRAM_KIND_GAP_ANALYSIS = 'Gap Analysis'

const StandardSelect = ({ defaultFramework }: StandardSelectProps) => {
  const { control, setValue, trigger } = useFormContext()
  const programKindName = useWatch({ control, name: 'programKindName' })
  const { field } = useController({ name: 'framework', control })

  const { data } = useGetStandards({})
  const frameworks = useMemo(() => data?.standards?.edges?.map((e) => e?.node as Standard).filter(Boolean) ?? [], [data])

  const options = useMemo(
    () =>
      frameworks.map((f) => ({
        label: getStandardLabel(f),
        value: f.shortName ?? '',
      })),
    [frameworks],
  )

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.PROGRAM),
      field: 'kind',
    },
  })

  const setSelectedFramework = useCallback(
    (value: string) => {
      const currentYear = new Date().getFullYear()
      const selected = frameworks.find((f) => f.shortName === value)
      field.onChange(value)
      const selectedLabel = enumOptions.find((t) => t.value === programKindName)?.label
      const autoName = programKindName === PROGRAM_KIND_GAP_ANALYSIS ? `${selectedLabel} - ${value} - ${currentYear}` : `${value} - ${currentYear}`

      setValue('name', autoName, { shouldValidate: true })
      setValue('standardID', selected?.id ?? '')
      trigger(['name', 'framework'])
    },
    [enumOptions, field, frameworks, programKindName, setValue, trigger],
  )

  useEffect(() => {
    if (!defaultFramework || field.value || frameworks.length === 0) return

    const normalizedDefaultFramework = normalizeFramework(defaultFramework)
    const selected = frameworks.find((framework) => {
      const shortName = normalizeFramework(framework.shortName)
      const label = normalizeFramework(getStandardLabel(framework))

      return shortName === normalizedDefaultFramework || label === normalizedDefaultFramework || Boolean(normalizedDefaultFramework && label?.startsWith(normalizedDefaultFramework))
    })

    if (selected?.shortName) {
      setSelectedFramework(selected.shortName)
    }
  }, [defaultFramework, field.value, frameworks, setSelectedFramework])

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
                setSelectedFramework(value)
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export default StandardSelect
