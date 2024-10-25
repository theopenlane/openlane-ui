import { tv, type VariantProps } from 'tailwind-variants'

const signupStyles = tv({
  slots: {
    separator: 'my-10',
    buttons: 'flex flex-col gap-8',
    keyIcon: 'text-aquamarine-900',
    form: 'flex flex-col gap-4 space-y-2',
    input: 'flex flex-col gap-2 text-firefly-950',
  },
})

export type SignupVariants = VariantProps<typeof signupStyles>

export { signupStyles }
