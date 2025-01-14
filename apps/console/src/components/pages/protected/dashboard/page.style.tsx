import { tv, type VariantProps } from 'tailwind-variants'

export const pageStyles = tv({
  slots: {
    dataRow: 'flex items-center justify-center my-2 gap-5',
    progressPercent: 'text-sm font-medium text-gray-900 dark:text-gray-50',
    progressLabel: 'text-sm text-gray-500 dark:text-oxford-blue-300',
    emptyRowInfo: 'italic items-center flex',
  },
})

export type PageVariants = VariantProps<typeof pageStyles>
