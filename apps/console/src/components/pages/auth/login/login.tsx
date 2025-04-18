'use client'

import { LoginUser } from '@repo/dally/user'
import { Button } from '@repo/ui/button'
import MessageBox from '@repo/ui/message-box'
import SimpleForm from '@repo/ui/simple-form'
import { ArrowUpRight } from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Separator } from '@repo/ui/separator'
import { loginStyles } from './login.styles'
import { GoogleIcon } from '@repo/ui/icons/google'
import { GithubIcon } from '@repo/ui/icons/github'
import { Input } from '@repo/ui/input'
import { PasswordInput } from '@repo/ui/password-input'
import { Label } from '@repo/ui/label'
import { getPasskeySignInOptions, verifyAuthentication } from '@/lib/user'
import { startAuthentication } from '@simplewebauthn/browser'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import Link from 'next/link'
import { recaptchaSiteKey } from '@repo/dally/auth'

const TEMP_PASSKEY_EMAIL = 'tempuser@test.com'
const TEMP_PASSKEY_NAME = 'Temp User'
import react from 'react'

export const LoginPage = () => {
  const { separator, buttons, keyIcon, form, input } = loginStyles()
  const router = useRouter()
  const [signInError, setSignInError] = useState(false)
  const [signInErrorMessage, setSignInErrorMessage] = useState('There was an error. Please try again.')
  const [signInLoading, setSignInLoading] = useState(false)
  const showLoginError = !signInLoading && signInError
  const [isPasswordActive, setIsPasswordActive] = useState(false)

  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const submit = async (payload: LoginUser) => {
    setSignInLoading(true)
    setSignInError(false)

    try {
      if (recaptchaSiteKey) {
        // @ts-ignore
        const recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'login' })

        const recaptchaValidation = await fetch('/api/recaptchaVerify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: recaptchaToken }),
        })

        const validationResponse = await recaptchaValidation.json()

        if (!validationResponse.success) {
          setSignInErrorMessage('reCAPTCHA validation failed.')
          setSignInLoading(false)
          setSignInError(true)
          return
        }
      }

      const res: any = await signIn('credentials', {
        redirect: false,
        ...payload,
      })

      if (res.ok && !res.error) {
        token ? router.push(`/invite?token=${token}`) : router.push(`/`)
      } else {
        let errMsg = 'There was an error. Please try again.'

        if (res?.code) {
          try {
            const parsed = JSON.parse(res.code)
            if (parsed?.error) {
              errMsg = parsed.error
            }
          } catch (e) {
            console.warn('Failed to parse signIn error code:', e)
          }
        }

        setSignInErrorMessage(errMsg)
        setSignInLoading(false)
        setSignInError(true)
      }
    } catch (error) {
      console.error('Login error:', error)
      setSignInErrorMessage('An unexpected error occurred.')
      setSignInLoading(false)
      setSignInError(true)
    }
  }

  /**
   * Setup Github Authentication
   */
  const github = async () => {
    await signIn('github', {
      redirectTo: token ? `/invite?token=${token}` : '/',
    })
  }

  /**
   * Setup Google Authentication
   */
  const google = async () => {
    await signIn('google', {
      redirectTo: token ? `/invite?token=${token}` : '/',
    })
  }

  /**
   * Setup PassKey SignIn
   */
  async function passKeySignIn() {
    try {
      const options = await getPasskeySignInOptions({
        email: TEMP_PASSKEY_EMAIL,
      })
      setSessionCookie(options.session)

      const assertionResponse = await startAuthentication(options.publicKey)
      const verificationResult = await verifyAuthentication({
        assertionResponse,
      })

      if (verificationResult.success) {
        await signIn('passkey', {
          callbackUrl: '/dashboard',
          email: TEMP_PASSKEY_EMAIL,
          name: TEMP_PASSKEY_NAME,
          session: verificationResult.session,
          accessToken: verificationResult.access_token,
          refreshToken: verificationResult.refresh_token,
        })
      }

      if (!verificationResult.success) {
        setSignInError(true)
        setSignInErrorMessage(`Error: ${verificationResult.error}`)
      }

      return verificationResult
    } catch (error) {
      setSignInError(true)
    }
  }

  return (
    <>
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
            onClick={() => {
              passKeySignIn()
            }}
          >
            PassKey
          </Button> */}
        </div>
        <Separator label="or" className={separator()} />
        <SimpleForm
          classNames={form()}
          onSubmit={(e: any) => {
            submit(e)
          }}
          onChange={(e: any) => {
            if (e.username.length > 0) {
              setIsPasswordActive(true)
            } else {
              setIsPasswordActive(false)
            }
          }}
        >
          <div className={input()}>
            <Label className="text-text-dark" htmlFor="username">
              Email
            </Label>
            <Input variant="light" name="username" placeholder="email@domain.com" className="!border-neutral-300 dark:!border-neutral-300" />
          </div>
          {isPasswordActive && (
            <div className={input()}>
              <Label className="text-text-dark" htmlFor="password">
                Password
              </Label>
              <PasswordInput variant="light" name="password" placeholder="password" autoComplete="current-password" className="!border-neutral-300 dark:!border-neutral-300" />
            </div>
          )}

          <Button variant="filled" className="  mr-auto mt-2 w-full" icon={<ArrowUpRight />} size="md" type="submit" iconAnimated>
            Login
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
        {showLoginError && <MessageBox className={'p-4 ml-1'} message={signInErrorMessage} />}
      </div>
    </>
  )
}
