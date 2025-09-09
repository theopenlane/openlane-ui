'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SimpleForm } from '@repo/ui/simple-form'
import MessageBox from '@repo/ui/message-box'
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

// const TEMP_PASSKEY_EMAIL = 'tempuser1@test.com'

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
    await signIn('google', { redirectTo: '/' })
  }

  async function validateEmail(payload: RegisterUser) {
    return allowedLoginDomains.some((domain) => payload.email.endsWith(domain))
  }

  // async function registerPasskey() {
  //   try {
  //     const options = await getPasskeyRegOptions({ email: TEMP_PASSKEY_EMAIL })
  //     setSessionCookie(options.session)
  //     const attestationResponse = await startRegistration(options.publicKey)
  //     const verificationResult = await verifyRegistration({ attestationResponse })

  //     if (verificationResult.success) {
  //       await signIn('passkey', {
  //         email: TEMP_PASSKEY_EMAIL,
  //         session: verificationResult.session,
  //         accessToken: verificationResult.access_token,
  //         refreshToken: verificationResult.refresh_token,
  //       })
  //     } else {
  //       setRegistrationErrorMessage(`Error: ${verificationResult.error}`)
  //     }
  //   } catch (error) {
  //     setRegistrationErrorMessage(`{${error || ''}}`)
  //   }
  // }

  return (
    <div className="flex flex-col self-center">
      <p className="text-2xl font-medium">Create your account</p>
      <p className="text-base mt-8">Connect to Openlane with</p>

      <div className={buttons()}>
        <Button className="bg-card !px-3.5 w-full" variant="outlineLight" size="md" icon={<GoogleIcon />} iconPosition="left" onClick={google}>
          <p className="text-sm font-normal">Google</p>
        </Button>

        <Button className="bg-card !px-3.5 w-full" variant="outlineLight" size="md" icon={<Github className="text-input-text" />} iconPosition="left" onClick={github}>
          <p className="text-sm font-normal">GitHub</p>
        </Button>
      </div>

      <Separator label="or, sign up with your email" login className={separator()} />

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
          <Input type="email" variant="light" name="email" placeholder="Enter your email" className="bg-transparent !text-text" />
        </div>

        {isPasswordActive && (
          <>
            <div className={input()}>
              <PasswordInput variant="light" name="password" placeholder="password" autoComplete="new-password" className="bg-transparent !text-text" />
            </div>
            <div className={input()}>
              <PasswordInput variant="light" name="confirmedPassword" placeholder="confirm password" autoComplete="new-password" className="bg-transparent !text-text" />
            </div>

            <button className="p-4 text-button-text bg-brand justify-between items-center rounded-md text-sm h-10 font-bold flex mt-2" type="submit" disabled={isLoading}>
              <span>{isLoading ? 'Creating account...' : 'Sign up'}</span>
              <ArrowRightCircle size={16} />
            </button>
          </>
        )}

        <div className="flex text-base mt-4">
          <span>Have an account?&nbsp;</span>
          <Link href="/login" className="text-base text-blue-500 hover:opacity-80 transition">
            Login to your account
          </Link>
        </div>
      </SimpleForm>

      <div className="flex gap-6 mt-9">
        <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`} className="text-xs opacity-90">
          Privacy Policy
        </Link>
        <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`} className="text-xs opacity-90">
          Terms of Service
        </Link>
      </div>

      <p className="text-xs mt-5">
        This site is protected by reCAPTCHA and the <br />
        Google Privacy Policy and Terms of Service apply.
      </p>

      {showError && <MessageBox maxWidth={320} className="p-4 ml-1" message={registrationErrorMessage} />}
    </div>
  )
}
