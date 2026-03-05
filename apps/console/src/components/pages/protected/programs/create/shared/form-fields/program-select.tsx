import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { useFormContext } from 'react-hook-form'
import { getYear } from 'date-fns'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'

const currentYear = getYear(new Date())

const ProgramTypeSelect = () => {
  const { control, setValue, trigger } = useFormContext()
  const { enumOptions, onCreateOption } = useCreatableEnumOptions({
    objectType: objectToSnakeCase(ObjectTypes.PROGRAM),
    field: 'kind',
  })

  return (
    <FormField
      control={control}
      name="programKindName"
      rules={{ required: 'Program type is required' }}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="mb-1.5 block text-sm">
            Program Type<span className="text-red-500"> *</span>
          </FormLabel>

          <FormControl>
            <CreatableCustomTypeEnumSelect
              value={field.value}
              options={enumOptions ?? []}
              onCreateOption={onCreateOption}
              placeholder="Select Program Type"
              searchPlaceholder="Search program type..."
              triggerClassName="grow justify-between"
              onValueChange={(value) => {
                field.onChange(value)

                setValue('programKindName', value)
                trigger('programKindName')

                if (value === 'Risk Assessment' || value === 'Gap Analysis') {
                  const selectedOption = enumOptions?.find((opt) => opt.value === value)
                  if (selectedOption?.label) {
                    setValue('name', `${selectedOption.label} - ${currentYear}`)
                  }
                }
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export default ProgramTypeSelect
