import { tv, type VariantProps } from 'tailwind-variants'

export const pageHeadingStyles = tv({
  slots: {
    wrapper: 'flex flex-col gap-[2px] mb-10',
    eyebrow:
      'font-mono uppercase text-sunglow-900 tracking-[0.025rem] text-[10px] font-semibold',
    heading: 'text-blackberry-800 text-3xl tracking-[-0.056rem]',
  },
})

export type PageHeadingVariants = VariantProps<typeof pageHeadingStyles>
