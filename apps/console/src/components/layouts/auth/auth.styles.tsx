import { tv, type VariantProps } from 'tailwind-variants'

const authStyles = tv({
  slots: {
    base: 'relative bg-glaucous-900 flex flex-col h-full w-full items-center justify-center',
    closeButton: 'absolute top-2 right-2 md:top-10 md:right-10 text-white',
    closeButtonIcon: 'h-8 w-8 z-20',
  },
})

export type AuthVariants = VariantProps<typeof authStyles>

export { authStyles }
