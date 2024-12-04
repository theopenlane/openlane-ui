import { tv, type VariantProps } from 'tailwind-variants'

const verificationStyles = tv({
  slots: {
    errorMessage: 'text-ziggurat-200 mt-14',
    success:
      'mt-14 bg-ziggurat-900 bg-opacity-20 p-5 rounded-md text-white flex justify-center text-center items-center gap-3',
    successMessage: 'flex text-center',
    successIcon: 'mt-1',
    loading: 'mt-14 p-5 rounded-md text-white flex gap-3',
    resendMessage: 'text-xs text-gray-400 mt-4 text-center',
  },
})

export type VerificationVariants = VariantProps<typeof verificationStyles>

export { verificationStyles }