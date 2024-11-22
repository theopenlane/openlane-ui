import { tv, type VariantProps } from 'tailwind-variants'

const loadingStyles = tv({
  slots: {
    loader: 'h-full w0full rounded bg-ziggurat-100 dark:bg-glaucous-950 animate-pulse',
  },
})

export type LoadingVariants = VariantProps<typeof loadingStyles>

export { loadingStyles }
