import { tv, type VariantProps } from 'tailwind-variants'

export const gridStyles = tv({
  slots: {
    wrapper: 'grid',
    row: 'grid',
    cell: '',
  },
  variants: {
    rows: {
      1: { wrapper: 'grid-rows-1' },
      2: { wrapper: 'grid-rows-2' },
      3: { wrapper: 'grid-rows-3' },
      4: { wrapper: 'grid-rows-4' },
    },
    columns: {
      1: { row: 'grid-cols-1' },
      2: { row: 'grid-cols-2 sm:grid-cols-1' },
      3: { row: 'grid-cols-3 sm:grid-cols-1' },
      4: { row: 'grid-cols-4 sm:grid-cols-1' },
    },
    gap: {
      0: { wrapper: 'gap-0', row: 'gap-0' },
      1: { wrapper: 'gap-1', row: 'gap-1' },
      2: { wrapper: 'gap-2', row: 'gap-2' },
      4: { wrapper: 'gap-4', row: 'gap-4' },
      8: { wrapper: 'gap-8', row: 'gap-8' },
      9: { wrapper: 'gap-9', row: 'gap-9' },
    },
  },
  defaultVariants: {
    rows: 1,
    columns: 1,
    gap: 4,
  },
})

export type GridVariants = VariantProps<typeof gridStyles>
