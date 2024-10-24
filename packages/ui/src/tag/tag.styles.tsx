import { tv, type VariantProps } from 'tailwind-variants'

const tagStyles = tv({
  slots: {
    base: 'font-mono border-java-500 text-java-500 text-[10px] uppercase px-2 py-0 font-semibold border rounded-md inline-flex justify-center items-center',
  },
})

export type TagVariants = VariantProps<typeof tagStyles>

export { tagStyles }
