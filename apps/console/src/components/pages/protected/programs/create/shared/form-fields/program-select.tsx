import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useFormContext } from 'react-hook-form'
import { getYear } from 'date-fns'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

const currentYear = getYear(new Date())

const ProgramTypeSelect = () => {
  const { control, setValue, trigger } = useFormContext()
  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.PROGRAM),
      field: 'kind',
    },
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
            <Select
              value={field.value}
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
              required
            >
              <SelectTrigger className="grow justify-between">
                <CustomTypeEnumValue value={field.value} options={enumOptions ?? []} placeholder="Select Program Type" />
              </SelectTrigger>

              <SelectContent>
                {enumOptions?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <CustomTypeEnumOptionChip option={opt} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItem>
      )}
    />
  )
}

export default ProgramTypeSelect
