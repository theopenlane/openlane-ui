import { tv, type VariantProps } from 'tailwind-variants'

const pageStyles = tv({
  slots: {
    content: 'flex items-center justify-center h-screen relative',
    form: 'w-full relative z-3 px-4'
  },
})

export type PageVariants = VariantProps<typeof pageStyles>

export { pageStyles }
