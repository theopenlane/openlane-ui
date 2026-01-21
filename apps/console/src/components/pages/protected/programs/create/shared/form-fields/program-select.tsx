import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useFormContext } from 'react-hook-form'
import { getYear } from 'date-fns'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'
import CustomTypeEnumChip from '@/components/shared/custom-type-enum-chip/custom-type-enum-chip'

const currentYear = getYear(new Date())

const ProgramTypeSelect = () => {
  const { control, setValue, trigger } = useFormContext()
  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'program',
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
                  const selectedLabel = enumOptions?.find((opt) => opt.value === value)?.label
                  if (selectedLabel) {
                    setValue('name', `${selectedLabel} - ${currentYear}`)
                  }
                }
              }}
              required
            >
              <SelectTrigger className="grow justify-between">
                <SelectValue placeholder="Select Program Type" />
              </SelectTrigger>

              <SelectContent>
                {enumOptions?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <CustomTypeEnumChip option={opt} />
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
