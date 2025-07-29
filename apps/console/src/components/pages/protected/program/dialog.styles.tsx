import { tv, type VariantProps } from 'tailwind-variants'

export const dialogStyles = tv({
  slots: {
    dialogContent: 'shadow-3xl rounded-xl max-h-[90vh]',
    dialogTrigger:
      'flex h-8 rounded-md bg-button text-button-text text-sm px-5 hover:!opacity-90 relative group font-sans font-semibold inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md leading-none transition-all duration-500 focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-oxford-blue-300 disabled:pointer-events-none disabled:opacity-50 tracking-normal',
    title: 'text-2xl font-bold',
    linkItem: 'flex items-center  whitespace-nowrap text-base overflow auto',
    formInput: 'overflow-auto p-6 rounded-lg items-start w-full h-[calc(90vh-200px)] bg-background-secondary',
    buttonRow: 'flex content-end justify-end gap-2 items-end',
  },
})

export type PageVariants = VariantProps<typeof dialogStyles>
