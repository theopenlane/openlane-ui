import { CalendarPopover } from '@repo/ui/calendar-popover'
import { FormControl, FormField, FormItem } from '@repo/ui/form'
import { useFormContext } from 'react-hook-form'

export const DateSelect = ({ name }: { name: string }) => {
  const { register, control } = useFormContext()

  return (
    <FormField
      control={control}
      name={register(name).name}
      render={({ field }) => (
        <FormItem className={'flex flex-col space-y-0'}>
          <FormControl>
            <CalendarPopover field={field} defaultToday />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
