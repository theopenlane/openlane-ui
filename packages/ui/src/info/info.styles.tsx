import { tv, type VariantProps } from 'tailwind-variants'

export const infoStyles = tv({
  slots: {
    panel: 'flex py-3 px-4 gap-4 rounded font-sans items-center',
  },
  variants: {
    style: {
      info: {
        panel: 'bg-button-muted text-text-dark rounded',
      },
    },
  },
  defaultVariants: {
    style: 'info',
  },
})

export type InfoVariants = VariantProps<typeof infoStyles>
