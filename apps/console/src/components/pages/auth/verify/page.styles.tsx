import { tv, type VariantProps } from 'tailwind-variants'

const verificationStyles = tv({
  slots: {
    content: 'flex flex-col min-h-screen w-full items-center space-between dark:bg-dk-surface-0 bg-surface-0',
    wrapper: 'flex flex-col justify-center mx-auto my-auto w-full p-6 sm:w-1/2 h-full relative ease-in-out',
    errorMessage: 'mt-14',
    success:
      'mt-14 bg-oxford-blue-900 bg-opacity-20 p-5 rounded-md text-white justify-center text-center',
    successMessage: 'text-center',
    successIcon: 'mt-1 justify-center items-center',
    loading: 'mt-14 p-5 rounded-md text-white flex gap-3',
    resendMessage: 'text-xs text-gray-400 mt-4 text-center',
    button: 'mt-12 flex w-full justify-center',
    logo: 'mx-auto b-3',
    verifying: 'text-3xl text-center mt-4 animate-pulse',
  },
})

export type VerificationVariants = VariantProps<typeof verificationStyles>

export { verificationStyles }