import { tv, type VariantProps } from 'tailwind-variants'

const loginStyles = tv({
  slots: {
    separator: 'my-10 bold',
    buttons: 'flex flex-col gap-8',
    keyIcon: '',
    form: 'flex flex-col gap-4 space-y-2',
    input: 'flex flex-col gap-2',
  },
})

export type LoginVariants = VariantProps<typeof loginStyles>

export { loginStyles }
