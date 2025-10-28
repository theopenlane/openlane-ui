'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SimpleForm } from '@repo/ui/simple-form'
import { Button } from '@repo/ui/button'
import { ArrowRightCircle } from 'lucide-react'
import { registerUser, type RegisterUser } from '@/lib/user'
import { GoogleIcon } from '@repo/ui/icons/google'
import { signIn } from 'next-auth/react'
import { Separator } from '@repo/ui/separator'
import { Input } from '@repo/ui/input'
import { PasswordInput } from '@repo/ui/password-input'
import Link from 'next/link'
import { allowedLoginDomains, recaptchaSiteKey } from '@repo/dally/auth'
import Github from '@/assets/Github'
import { loginStyles } from '../login/login.styles'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import { cn } from '@repo/ui/lib/utils'

export const SignupPage = () => {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const router = useRouter()
  const [registrationErrorMessage, setRegistrationErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isPasswordActive, setIsPasswordActive] = useState(false)
  const { separator, buttons, form, input } = loginStyles()

  const showError = !isLoading && !!registrationErrorMessage

  const github = async () => {
    await signIn('github', { redirectTo: '/' })
  }

  const google = async () => {
    await signIn('google', {
      redirect: true,
      redirectTo: '/signup',
    })
  }

  async function validateEmail(payload: RegisterUser) {
    return allowedLoginDomains.length === 0 || allowedLoginDomains.some((domain) => payload.email.endsWith(domain))
  }

  return (
    <div className="flex flex-col self-center  text-center">
      <p className="text-3xl font-medium">Create your account</p>
      {!isPasswordActive && (
        <div className="mt-2 text-center">
          <span className="text-muted-foreground text-sm">Already have an account?&nbsp;</span>
          <Link href="/login" className="text-sm hover:text-blue-500 hover:opacity-80 transition-color duration-500">
            Login
          </Link>
        </div>
      )}

      <div className={cn(buttons(), 'mt-[32px]')}>
        <Button className="!px-3.5 w-full hover:opacity-60 transition" variant="outlineLight" size="md" icon={<GoogleIcon />} iconPosition="left" onClick={google}>
          <p className="text-sm font-normal">Google</p>
        </Button>

        <Button className="!px-3.5 w-full hover:opacity-60 transition" variant="outlineLight" size="md" icon={<Github className="text-input-text" />} iconPosition="left" onClick={github}>
          <p className="text-sm font-normal">GitHub</p>
        </Button>
      </div>

      <Separator label="or" login className={cn(separator(), 'text-muted-foreground')} />

      <SimpleForm
        classNames={form()}
        onChange={(e: { email: string }) => setIsPasswordActive(e.email.length > 0)}
        onSubmit={async (payload: RegisterUser) => {
          setIsLoading(true)
          setRegistrationErrorMessage('')
          try {
            if (recaptchaSiteKey) {
              const recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'signup' })
              const validation = await fetch('/api/recaptchaVerify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: recaptchaToken }),
              })

              const validationResult = await validation.json()
              if (!validationResult.success) {
                setRegistrationErrorMessage('reCAPTCHA validation failed.')
                setIsLoading(false)
                return
              }
            }

            const isEmailValid = await validateEmail(payload)
            if (!isEmailValid) {
              router.push('/waitlist')
              return
            }

            if (payload.password === payload.confirmedPassword) {
              delete payload.confirmedPassword

              if (token) {
                payload.token = token
              }

              const res = await registerUser(payload)

              if (res?.ok && token) {
                router.push(`/login`)
              } else if (res?.ok) {
                router.push('/verify')
              } else if (res?.message) {
                setRegistrationErrorMessage(res.message)
              } else {
                setRegistrationErrorMessage('Unknown error. Please try again.')
              }
            } else {
              setRegistrationErrorMessage('Passwords do not match')
            }
          } catch (err) {
            console.error('Signup error:', err)
            setRegistrationErrorMessage('Unknown error. Please try again.')
          } finally {
            setIsLoading(false)
          }
        }}
      >
        <div className={input()}>
          <div className="flex items-center gap-1">
            <p className="text-sm">Email</p>
          </div>
          <Input type="email" variant="light" name="email" placeholder="Enter your email" className={`bg-transparent !text-text ${showError ? 'border border-toast-error-icon' : ''}`} />
          {showError && <span className="text-xs text-toast-error-icon text-left">{registrationErrorMessage}</span>}
        </div>

        {isPasswordActive && (
          <>
            <div className={input()}>
              <PasswordInput variant="light" name="password" placeholder="password" autoComplete="new-password" className="bg-transparent !text-text" />
            </div>
            <div className={input()}>
              <PasswordInput variant="light" name="confirmedPassword" placeholder="confirm password" autoComplete="new-password" className="bg-transparent !text-text" />
            </div>

            <Button variant="secondary" className="p-4 justify-between items-center rounded-md text-sm h-[36px] font-bold flex mt-2" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Creating account...' : 'Sign up'}</span>
              <ArrowRightCircle size={16} />
            </Button>
          </>
        )}
      </SimpleForm>

      <div className="text-xs opacity-90 flex gap-1 mt-4  text-muted-foreground">
        By signing up, you agree to our
        <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`} className="text-xs underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500">
          Terms of Service
        </Link>{' '}
        and
        <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`} className="text-xs underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500">
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
