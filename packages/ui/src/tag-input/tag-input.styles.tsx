import { tv, type VariantProps } from 'tailwind-variants'

export const tagInputStyles = tv({
  slots: {
    inlineTagsContainer: 'flex-wrap	',
    input: 'border-none outline-none focus:outline-none focus:ring-0 text-s',
    tag: 'bg-java-400 border-oxford-blue-200 text-oxford-blue-800 py-[7px] px-[10px] rounded-[5px] text-sm gap-[10px]',
    tagClose: 'text-oxford-blue-800 p-0',
  },
})

export type TagInputVariants = VariantProps<typeof tagInputStyles>
