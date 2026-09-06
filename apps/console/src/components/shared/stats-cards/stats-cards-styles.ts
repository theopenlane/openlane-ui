import { tv, type VariantProps } from 'tailwind-variants'

export const statCardStyles = tv({
  slots: {
    wrapper: 'shadow-xs border rounded-lg w-full ',
    content: 'space-y-2',
    title: 'text-lg font-medium flex items-center',
    percentage: 'text-3xl font-semibold',
    statDetails: 'flex justify-between text-xs',
    progressWrapper: 'w-full h-2 rounded-full bg-gray-100',
    progressBar: 'h-2 rounded-full',
  },
  variants: {
    color: {
      green: {
        progressBar: 'bg-green-500',
      },
      red: {
        progressBar: 'bg-red-700',
      },
      blue: {
        progressBar: 'bg-blue-500',
      },
    },
  },
})

export type StatCardVariants = VariantProps<typeof statCardStyles>
