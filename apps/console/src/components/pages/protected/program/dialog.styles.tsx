import { tv, type VariantProps } from 'tailwind-variants'

export const dialogStyles = tv({
    slots: {
        dialogContent: 'shadow-3xl rounded-xl',
        dialogTrigger: 'flex h-12 rounded-md text-base px-5 bg-java-400 dark:bg-java-400 hover:!opacity-90 text-oxford-blue-100 dark:text-oxford-blue-950 relative group font-sans font-semibold text-oxford-blue-900 inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md leading-none transition-all duration-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-oxford-blue-300 disabled:pointer-events-none disabled:opacity-50',
        title: 'text-2xl font-bold',
        navCard: 'flex items-center mr-5 w-1/4 h-full',
        linkItem: 'flex items-center w-full mx-3 h-[144px]',
        formInput: 'p-6 rounded-lg items-start w-full h-[93%]',
        formCard: 'flex items-start w-3/4 h-full',
        buttonRow: 'flex content-end justify-end gap-2 items-end',
    },
})

export type PageVariants = VariantProps<typeof dialogStyles>
