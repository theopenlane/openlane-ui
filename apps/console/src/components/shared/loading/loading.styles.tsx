import { tv, type VariantProps } from 'tailwind-variants'

const loadingStyles = tv({
  slots: {
    loader: 'h-16 w-full rounded-sm animate-pulse bg-muted',
  },
})

export type LoadingVariants = VariantProps<typeof loadingStyles>

export { loadingStyles }
