import { tv, type VariantProps } from 'tailwind-variants'

const personalAccessTokenFormStyles = tv({
  slots: {
    grid: 'grid grid-cols-2 gap-[34px] mb-[34px] grid-rows-[auto,auto]',
    copyIcon: 'text-java-400 cursor-pointer',
    tokenField: 'mt-[23px]',
    calendarIcon: 'ml-auto h-4 w-4 opacity-50',
    calendarInput:
      'flex justify-between w-full items-center font-normal tracking-[-0.16px]',
    expiryColumn: 'flex flex-col',
    calendarPopover: 'w-auto p-0',
    checkboxRow: 'flex items-center !mt-[18px]',
  },
})

export type PersonalAccessTokenFormVariants = VariantProps<
  typeof personalAccessTokenFormStyles
>

export { personalAccessTokenFormStyles }
