import { tv, type VariantProps } from 'tailwind-variants'

const searchStyles = tv({
    slots: {
        item: "data-[selected='true']:bg-teal-400 data-[selected='true']:bg-opacity-10 data-[selected='true']:dark:text-text-light",
        popover: "max-w-[300px] max-h-[400px] overflow-y-auto overflow-x-hidden px-1 py-1 m-0 rounded-md shadow-lg border border-border",
        idResult: "text-xs text-opacity-20"
    },
})

export type HeaderVariants = VariantProps<typeof searchStyles>

export { searchStyles }
