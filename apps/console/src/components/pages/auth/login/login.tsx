'use client'

import { LoginUser } from '@repo/dally/user'
import { Button } from '@repo/ui/button'
import MessageBox from '@repo/ui/message-box'
import SimpleForm from '@repo/ui/simple-form'
import { ArrowUpRight, KeyRoundIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
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
import { useNotification } from '@/hooks/useNotification'

export const LoginPage = () => {
  const { separator, buttons, keyIcon, form, input } = loginStyles()
  const router = useRouter()
  const [signInError, setSignInError] = useState(false)
  const [signInErrorMessage, setSignInErrorMessage] = useState('There was an error. Please try again.')
  const [signInLoading, setSignInLoading] = useState(false)
  const showLoginError = !signInLoading && signInError
  const [loginMethods, setLoginMethods] = useState<string[]>([])
  const [usePasswordLogin, setUsePasswordLogin] = useState(false)
  const [isPasswordActive, setIsPasswordActive] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [passkeyStatus, setPasskeyStatus] = useState('')
  const [isCheckingLoginMethods, setIsCheckingLoginMethods] = useState(false)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const { successNotification, errorNotification } = useNotification()

  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const checkLoginMethods = async (email: string) => {
    if (!email) {
      setLoginMethods([])
      setIsPasswordActive(false)
      return
    }

    try {
      setIsCheckingLoginMethods(true)
      const response = await fetch('/api/auth/login-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (data.success) {
        setLoginMethods(data.methods)

        // show password input if user prefers password login or if CREDENTIALS is the only option
        if (data.methods.includes('CREDENTIALS') && (!data.methods.includes('WEBAUTHN') || usePasswordLogin)) {
          setIsPasswordActive(true)
        } else {
          setIsPasswordActive(false)
        }
      }
    } catch (error) {
      console.error('Failed to fetch login methods:', error)
      errorNotification({
        title: 'Could not fetch available auth methods',
        description: 'Please verify you have provided an email that has an account',
      })
    } finally {
      setIsCheckingLoginMethods(false)
    }
  }

  const debouncedCheckLoginMethods = (email: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }
    debounceTimeout.current = setTimeout(() => checkLoginMethods(email), 500)
  }

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

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
          setSignInError(true)
          setSignInLoading(false)
          setSignInErrorMessage('reCAPTCHA validation failed.')
          return
        }
      }

      const res: any = await signIn('credentials', { redirect: false, ...payload })
      if (res.ok && !res.error) {
        token ? router.push(`/invite?token=${token}`) : router.push(`/`)
      } else {
        setSignInLoading(false)
        setSignInError(true)
      }
    } catch (error) {
      console.error('Login error:', error)
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
      setIsPasskeyLoading(true)
      setSignInError(false)
      setSignInErrorMessage('')
      setPasskeyStatus('Initializing passkey authentication...')

      const options = await getPasskeySignInOptions({
        email: (document.querySelector('input[name="username"]') as HTMLInputElement)?.value || '',
      })
      setSessionCookie(options.session)
      setPasskeyStatus('Waiting for your passkey...')

      const assertionResponse = await startAuthentication({
        optionsJSON: options.publicKey,
      })

      setPasskeyStatus('Verifying your passkey...')
      const verificationResult = await verifyAuthentication({
        assertionResponse,
      })

      if (verificationResult.success) {
        setPasskeyStatus('Authentication successful, redirecting...')
        await signIn('passkey', {
          callbackUrl: '/dashboard',
          email: (document.querySelector('input[name="username"]') as HTMLInputElement)?.value || '',
          session: verificationResult.session,
          accessToken: verificationResult.access_token,
          refreshToken: verificationResult.refresh_token,
        })
      } else {
        setSignInError(true)
        setSignInErrorMessage(`Error: ${verificationResult.error}`)
      }

      return verificationResult
    } catch (err: any) {
      if (err.name === 'AbortError' || err.name === 'NotAllowedError') {
        console.error('Error during passkey login:', err)
        errorNotification({ title: 'User canceled the passkey login request' })
        return
      }

      setSignInError(true)
      setSignInErrorMessage('An unexpected error occurred during passkey login')
    } finally {
      setIsPasskeyLoading(false)
      setPasskeyStatus('')
    }
  }

  return (
    <>
      <div className="flex flex-col mt-8 justify-start">
        <div className={buttons()}>
          <Button variant="outlineLight" size="md" icon={<GoogleIcon />} iconPosition="left" onClick={() => google()} disabled={isPasskeyLoading || isCheckingLoginMethods || signInLoading}>
            Google
          </Button>

          <Button variant="outlineLight" size="md" icon={<GithubIcon />} iconPosition="left" onClick={() => github()} disabled={isPasskeyLoading || isCheckingLoginMethods || signInLoading}>
            GitHub
          </Button>
        </div>

        <Separator label="or" className={separator()} />

        <SimpleForm
          classNames={form()}
          onSubmit={(e: any) => {
            submit(e)
          }}
          onChange={(e: any) => {
            if (e.username.length > 0) {
              debouncedCheckLoginMethods(e.username)
            } else {
              setIsPasswordActive(false)
              setLoginMethods([])
            }
          }}
        >
          <div className={input()}>
            <Label className="text-text-dark" htmlFor="username">
              Email
            </Label>
            <Input variant="light" name="username" placeholder="email@domain.com" className="!border-neutral-300 dark:!border-neutral-300" />
          </div>

          {loginMethods.includes('WEBAUTHN') && !usePasswordLogin && (
            <>
              <Button
                variant="outlineLight"
                size="md"
                icon={<KeyRoundIcon className={keyIcon()} />}
                iconPosition="left"
                onClick={() => passKeySignIn()}
                className="mt-2 w-full"
                disabled={isPasskeyLoading || signInLoading}
              >
                {isPasskeyLoading ? 'Authenticating...' : 'Continue with PassKey'}
              </Button>
              {isPasskeyLoading && passkeyStatus && <p className="text-sm text-gray-600 mt-2 text-center">{passkeyStatus}</p>}
            </>
          )}

          {loginMethods.includes('CREDENTIALS') && (usePasswordLogin || !loginMethods.includes('WEBAUTHN')) && (
            <>
              <div className={input()}>
                <Label className="text-text-dark" htmlFor="password">
                  Password
                </Label>
                <PasswordInput variant="light" name="password" placeholder="password" autoComplete="current-password" className="!border-neutral-300 dark:!border-neutral-300" />
              </div>
              <Button variant="filled" className="mr-auto mt-2 w-full" icon={<ArrowUpRight />} size="md" type="submit" iconAnimated>
                Login
              </Button>
            </>
          )}

          {loginMethods.includes('WEBAUTHN') && loginMethods.includes('CREDENTIALS') && (
            <button
              type="button"
              className={`text-sm text-blue-500 mt-2 hover:underline ${isPasskeyLoading || signInLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setUsePasswordLogin(!usePasswordLogin)}
              disabled={isPasskeyLoading || signInLoading}
            >
              {usePasswordLogin ? 'Use PassKey instead' : 'Use password instead'}
            </button>
          )}
        </SimpleForm>

        {isCheckingLoginMethods && <p className="text-sm text-gray-600 mt-2 text-center">Checking available login methods...</p>}

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
