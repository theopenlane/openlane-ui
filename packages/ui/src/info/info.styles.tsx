import { tv, type VariantProps } from 'tailwind-variants'

export const infoStyles = tv({
  slots: {
    panel: 'flex py-3 px-4 gap-4 rounded font-sans items-center',
  },
  variants: {
    style: {
      info: {
        panel: 'bg-blackberry-100 text-blackberry-600',
      },
    },
  },
  defaultVariants: {
    style: 'info',
  },
})

export type InfoVariants = VariantProps<typeof infoStyles>
