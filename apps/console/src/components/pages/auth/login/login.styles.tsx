import { tv, type VariantProps } from 'tailwind-variants'

const loginStyles = tv({
  slots: {
    separator: 'my-6 bold !text-text',
    buttons: 'flex gap-2.5 mt-2.5',
    keyIcon: '',
    form: 'flex flex-col gap-4 gap-2.5',
    input: 'flex flex-col gap-2',
  },
})

export type LoginVariants = VariantProps<typeof loginStyles>

export { loginStyles }
