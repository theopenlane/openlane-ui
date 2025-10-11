import { ProgramTypeOptions } from '@/components/shared/enum-mapper/program-enum'
import { ProgramProgramType } from '@repo/codegen/src/schema'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useFormContext } from 'react-hook-form'
import { getYear } from 'date-fns'

const currentYear = getYear(new Date())

const ProgramTypeSelect = () => {
  const { control, setValue, trigger } = useFormContext()

  return (
    <FormField
      control={control}
      name="programType"
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
                setValue('programType', value)
                trigger('programType')
                if (value === ProgramProgramType.RISK_ASSESSMENT || value === ProgramProgramType.GAP_ANALYSIS) {
                  const selectedLabel = ProgramTypeOptions.find((type) => type.value === value)?.label
                  setValue('name', `${selectedLabel} - ${currentYear}`)
                }
              }}
              required
            >
              <SelectTrigger className={'grow justify-between'}>
                <SelectValue placeholder="Select Program Type" />
              </SelectTrigger>
              <SelectContent>
                {ProgramTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
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
