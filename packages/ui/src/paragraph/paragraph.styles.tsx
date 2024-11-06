import { tv, type VariantProps } from 'tailwind-variants'

export const paragraphStyles = tv({
  slots: {
    wrapper: 'flex flex-col gap-[2px] mb-10',
    paragraph: 'font-sans',
  },
})

export type ParagraphVariants = VariantProps<typeof paragraphStyles>
