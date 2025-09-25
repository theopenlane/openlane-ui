import { tv, type VariantProps } from 'tailwind-variants'

const pageStyles = tv({
  slots: {
    logo: 'flex justify-center mb-10',
    bg: 'absolute h-full w-2/3 top-0 left-0 opacity-0 transition-opacity duration-700',
    bgImage: 'object-cover h-full z-10',
    content: 'relative z-20 shadow-2xl bg-white rounded-lg flex flex-col justify-center mx-auto my-auto py-16 px-12 w-full max-w-lg',
  },
  variants: {
    activeBg: {
      true: {
        bg: 'opacity-100',
      },
    },
  },
  defaultVariants: {
    activeBg: false,
  },
})

export type PageVariants = VariantProps<typeof pageStyles>

export { pageStyles }
