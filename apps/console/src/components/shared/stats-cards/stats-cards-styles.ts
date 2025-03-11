import { tv, type VariantProps } from 'tailwind-variants'

export const statCardStyles = tv({
  slots: {
    wrapper: 'shadow-sm border rounded-lg w-full max-w-sm',
    content: 'space-y-2',
    title: 'text-lg font-medium flex items-center',
    trendBadge: 'text-xs flex items-center px-2 py-1 rounded-full',
    percentage: 'text-3xl font-semibold',
    statDetails: 'flex justify-between text-xs',
    progressWrapper: 'w-full h-1.5 rounded-full',
    progressBar: 'h-1.5 rounded-full',
  },
  variants: {
    color: {
      green: {
        trendBadge: 'bg-green-200 text-green-700',
        progressWrapper: 'bg-green-50',
        progressBar: 'bg-green-400',
      },
      red: {
        trendBadge: 'bg-red-200 text-red-700',
        progressWrapper: 'bg-red-50',
        progressBar: 'bg-red-700',
      },
      yellow: {
        trendBadge: 'bg-slate-200 text-slate-700',
        progressWrapper: 'bg-yellow-50',
        progressBar: 'bg-yellow-500',
      },
    },
  },
})

export type StatCardVariants = VariantProps<typeof statCardStyles>
