import { tv, type VariantProps } from 'tailwind-variants'

const authStyles = tv({
  slots: {
    base: 'relative w-full min-h-screen  bg-background',
    closeButton: 'absolute top-2 right-2 md:top-10 md:right-10 text-white',
  },
})

export type AuthVariants = VariantProps<typeof authStyles>

export { authStyles }
