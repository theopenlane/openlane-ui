import { tv, type VariantProps } from 'tailwind-variants'

export const wizardStyles = tv({
  slots: {
    formRow: 'fmt-[12px] grow justify-between py-2',
    inputRow: 'grow justify-between',
    longTextRow: 'grow',
    switchRow: 'py-1',
    calendarIcon: 'ml-10 h-4 w-4 opacity-50',
    calendarInput: 'flex justify-between w-full items-center font-normal px-2 tracking-[-0.16px]',
    calendarPopover: 'w-auto p-0 z-10',
    dateInput: 'flex flex-col',
    reviewCardContent: 'flex items-center content-center',
    checkIcon: 'text-green-500 mr-5',
    checkIconReview: 'text-green-500 ml-2',
    xIcon: 'text-red-500 mr-5',
    warnIcon: 'text-saffron-500 mr-5',
    tooltip: 'bg-background max-w-72',
    inlineReviewValue: 'text-sm pl-4',
    reviewValue: 'flex items-center content-center text-gray-500 text-sm pl-10 pt-2',
  },
})

export type PageVariants = VariantProps<typeof wizardStyles>
