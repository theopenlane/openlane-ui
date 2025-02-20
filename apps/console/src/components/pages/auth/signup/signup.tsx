'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleForm } from '@repo/ui/simple-form'
import { MessageBox } from '@repo/ui/message-box'
import { Button } from '@repo/ui/button'
import { ArrowUpRight } from 'lucide-react'
import { getPasskeyRegOptions, registerUser, verifyRegistration, type RegisterUser } from '@/lib/user'
import { GoogleIcon } from '@repo/ui/icons/google'
import { GithubIcon } from '@repo/ui/icons/github'
import { signIn } from 'next-auth/react'
import { signupStyles } from './signup.styles'
import { Separator } from '@repo/ui/separator'
import { Input } from '@repo/ui/input'
import { PasswordInput } from '@repo/ui/password-input'
import { Label } from '@repo/ui/label'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import { startRegistration } from '@simplewebauthn/browser'
import Link from 'next/link'
import { allowedLoginDomains, recaptchaSiteKey } from '@repo/dally/auth'

const TEMP_PASSKEY_EMAIL = 'tempuser@test.com'
const TEMP_PASSKEY_NAME = 'Temp User'

export const SignupPage = () => {
  const router = useRouter()
  const [registrationErrorMessage, setRegistrationErrorMessage] = useState('There was an error. Please try again.')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const showLoginError = !isLoading && !!setRegistrationErrorMessage
  const [isPasswordActive, setIsPasswordActive] = useState(false)
  const { separator, buttons, keyIcon, form, input } = signupStyles()

  /**
   * Setup Github Authentication
   */
  const github = async () => {
    await signIn('github', {
      redirectTo: '/',
    })
  }

  /**
   * Setup Google Authentication
   */
  const google = async () => {
    await signIn('google', {
      redirectTo: '/',
    })
  }

  /**
   * Validate Email Domain for Sign Up
   */
  async function validateEmail(payload: any) {
    return allowedLoginDomains.some((domain) => payload.email.endsWith(domain))
  }

  /**
   * Setup PassKey Registration
   */
  async function registerPassKey() {
    try {
      const options = await getPasskeyRegOptions({
        email: TEMP_PASSKEY_EMAIL,
        name: TEMP_PASSKEY_NAME,
      })
      setSessionCookie(options.session)
      const attestationResponse = await startRegistration(options.publicKey)
      const verificationResult = await verifyRegistration({
        attestationResponse,
      })

      if (verificationResult.success) {
        await signIn('passkey', {
          email: TEMP_PASSKEY_EMAIL,
          name: TEMP_PASSKEY_NAME,
          session: verificationResult.session,
          accessToken: verificationResult.access_token,
          refreshToken: verificationResult.refresh_token,
        })
      }

      if (!verificationResult.success) {
        setRegistrationErrorMessage(`Error: ${verificationResult.error}`)
      }

      return verificationResult
    } catch (error) {
      setRegistrationErrorMessage(`{${error || ''}}`)
    }
  }

  return (
    <div className="flex flex-col mt-8 justify-start">
      <div className={buttons()}>
        <Button
          variant="outlineLight"
          size="md"
          icon={<GoogleIcon />}
          iconPosition="left"
          onClick={() => {
            google()
          }}
        >
          Google
        </Button>

        <Button
          variant="outlineLight"
          size="md"
          icon={<GithubIcon />}
          iconPosition="left"
          onClick={() => {
            github()
          }}
        >
          GitHub
        </Button>

        {/* <Button
          variant="outlineLight"
          size="md"
          icon={<KeyRoundIcon className={keyIcon()} />}
          iconPosition="left"
          onClick={registerPassKey}
        >
          PassKey
        </Button> */}
      </div>

      <Separator label="or" className={separator()} />

      <SimpleForm
        classNames={form()}
        onChange={(e: any) => {
          if (e.email.length > 0) {
            setIsPasswordActive(true)
          } else {
            setIsPasswordActive(false)
          }
        }}
        onSubmit={async (payload: RegisterUser) => {
          setIsLoading(true)
          setRegistrationErrorMessage('')
          try {
            if (recaptchaSiteKey) {
              // @ts-ignore
              const recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'signup' })

              const recaptchaValidation = await fetch('/api/recaptchaVerify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: recaptchaToken }),
              })

              const validationResponse = await recaptchaValidation.json()

              if (!validationResponse.success) {
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

              const res: any = await registerUser(payload)
              if (res?.ok) {
                router.push('/verify')
              } else if (res?.message) {
                setRegistrationErrorMessage(res.message)
              } else {
                setRegistrationErrorMessage('Unknown error. Please try again.')
              }
            } else {
              setRegistrationErrorMessage('Passwords do not match')
            }
          } catch (error) {
            console.error('Signup error:', error)
            setRegistrationErrorMessage('Unknown error. Please try again.')
          } finally {
            setIsLoading(false)
          }
        }}
      >
        <div className={input()}>
          <Label className="text-text-dark" htmlFor="username">
            Email
          </Label>
          <Input variant="light" name="email" placeholder="email@domain.com" autoComplete="email" required type="email" />
        </div>
        {isPasswordActive && (
          <>
            <div className={input()}>
              <Label className="text-text-dark" htmlFor="password">
                Password
              </Label>
              <PasswordInput variant="light" name="password" placeholder="password" autoComplete="new-password" required />
              <PasswordInput variant="light" name="confirmedPassword" placeholder="confirm password" autoComplete="new-password" required />
            </div>
          </>
        )}
        {showLoginError && <MessageBox className={'p-4 ml-1'} message={registrationErrorMessage} />}

        <Button className="mr-auto mt-2 w-full" icon={<ArrowUpRight />} size="md" type="submit" iconAnimated>
          {isLoading ? 'loading' : 'Sign up'}
        </Button>
      </SimpleForm>

      <Link href="https://www.theopenlane.io/legal/privacy" className="text-xs text-gray-500 mt-8 text-center">
        Privacy Policy
      </Link>
      <Link href="https://www.theopenlane.io/legal/terms-of-service" className="text-xs text-gray-500 mt-1 text-center">
        Terms of Service
      </Link>

      <div className="text-[10px] text-gray-500 mt-5 text-center">
        This site is protected by reCAPTCHA and the Google{' '}
        <a className="text-blue-500 underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a className="text-blue-500 underline" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>{' '}
        apply.
      </div>
    </div>
  )
}
