import { tv, type VariantProps } from 'tailwind-variants'

export const wizardStyles = tv({
  slots: {
    formRow: 'fmt-[12px] grow justify-between py-2',
    inputRow: 'grow justify-between',
    longTextRow: 'grow',
    switchRow: 'py-1',
    calendarIcon: 'ml-10 h-4 w-4 opacity-50',
    calendarInput:
      'flex justify-between w-full items-center font-normal px-2 tracking-[-0.16px]',
    calendarPopover: 'w-auto p-0',
    dateInput: 'flex flex-col',
  },
})

export type PageVariants = VariantProps<typeof wizardStyles>
