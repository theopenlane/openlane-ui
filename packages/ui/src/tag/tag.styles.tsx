import { tv, type VariantProps } from 'tailwind-variants'

const tagStyles = tv({
  slots: {
    base: 'text-tags-text bg-tags-bg text-[10px] uppercase px-2 py-0 font-bold border rounded-md inline-flex justify-center items-center',
  },
})

export type TagVariants = VariantProps<typeof tagStyles>

export { tagStyles }
