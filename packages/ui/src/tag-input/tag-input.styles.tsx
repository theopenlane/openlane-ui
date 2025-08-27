import { tv, type VariantProps } from 'tailwind-variants'

export const tagInputStyles = tv({
  slots: {
    inlineTagsContainer: 'flex-wrap bg-panel',
    input: 'border-none outline-hidden focus:outline-hidden  text-s',
    tag: 'bg-tags-bg border-tags-border text-tags-text py-[7px] px-[10px] rounded-[5px] text-sm gap-[10px]',
    tagClose: 'text-oxford-blue-800 p-0',
  },
})

export type TagInputVariants = VariantProps<typeof tagInputStyles>
