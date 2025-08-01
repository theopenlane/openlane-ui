import { tv, type VariantProps } from 'tailwind-variants'

export const calendarPopoverStyles = tv({
  slots: {
    calendarIcon: 'ml-10 h-4 w-4 opacity-50',
    calendarInput: 'text-sm flex justify-between w-full items-center font-normal px-2 tracking-[-0.16px]',
    calendarPopover: 'w-auto p-0 z-50',
  },
})

export type PageVariants = VariantProps<typeof calendarPopoverStyles>
