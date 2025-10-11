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
            <CalendarPopover
              field={field}
              defaultToday
              customSelect={[
                { value: 0, label: 'Today' },
                { value: 1, label: 'Tomorrow' },
                { value: 7, label: 'In 1 week' },
                { value: 30, label: 'In 1 month' },
              ]}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
