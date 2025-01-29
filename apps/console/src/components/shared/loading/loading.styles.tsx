import { tv, type VariantProps } from 'tailwind-variants'

const loadingStyles = tv({
  slots: {
    loader: 'h-full w-full rounded animate-pulse',
  },
})

export type LoadingVariants = VariantProps<typeof loadingStyles>

export { loadingStyles }
