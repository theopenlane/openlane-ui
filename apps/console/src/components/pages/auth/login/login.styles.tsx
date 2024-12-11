import { tv, type VariantProps } from 'tailwind-variants'

const loginStyles = tv({
  slots: {
    separator: 'my-10 text-firefly-950 bold',
    buttons: 'flex flex-col gap-8',
    keyIcon: 'text-firefly-950',
    form: 'flex flex-col gap-4 space-y-2',
    input: 'flex flex-col gap-2 text-firefly-950',
  },
})

export type LoginVariants = VariantProps<typeof loginStyles>

export { loginStyles }
