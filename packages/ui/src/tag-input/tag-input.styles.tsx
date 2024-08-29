import { tv, type VariantProps } from 'tailwind-variants'

export const tagInputStyles = tv({
  slots: {
    inlineTagsContainer: 'flex-wrap	',
    input: 'border-none outline-none focus:outline-none focus:ring-0 text-xs',
    tag: 'bg-winter-sky-800 border-winter-sky-900 text-blackberry-800 py-[7px] px-[10px] rounded-[5px] text-xs gap-[10px]',
    tagClose: 'text-blackberry-800 p-0',
  },
})

export type TagInputVariants = VariantProps<typeof tagInputStyles>
