import { tv, type VariantProps } from 'tailwind-variants'

const kbdStyles = tv({
  slots: {
    base: 'border-java-800 border w-6 h-6 rounded-md inline-flex justify-center items-center dark:border-java-800',
  },
  variants: {
    size: {
      small: {
        base: 'text-[10px] w-4 h-4',
      },
      medium: {
        base: 'text-s',
      },
    },
  },
  defaultVariants: {
    size: 'medium',
  },
})

export type KbdVariants = VariantProps<typeof kbdStyles>

export { kbdStyles }
