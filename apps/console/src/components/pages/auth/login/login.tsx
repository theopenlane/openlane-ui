'use client'

import { LoginUser } from '@repo/dally/user'
import { Button } from '@repo/ui/button'
import MessageBox from '@repo/ui/message-box'
import SimpleForm from '@repo/ui/simple-form'
import { ArrowRightCircle, KeyRoundIcon } from 'lucide-react'
import { signIn, SignInResponse } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Separator } from '@repo/ui/separator'
import { loginStyles } from './login.styles'
import { GoogleIcon } from '@repo/ui/icons/google'
import { Input } from '@repo/ui/input'
import { PasswordInput } from '@repo/ui/password-input'
import { getPasskeySignInOptions, verifyAuthentication } from '@/lib/user'
import { startAuthentication } from '@simplewebauthn/browser'
import { setSessionCookie } from '@/lib/auth/utils/set-session-cookie'
import Link from 'next/link'
import { recaptchaSiteKey } from '@repo/dally/auth'
import { useNotification } from '@/hooks/useNotification'
import Github from '@/assets/Github'
import { OPENLANE_WEBSITE_URL } from '@/constants'

export const LoginPage = () => {
  const { separator, buttons, form, input } = loginStyles()

  const router = useRouter()
  const [signInError, setSignInError] = useState(false)
  const [signInErrorMessage, setSignInErrorMessage] = useState('There was an error. Please try again.')
  const [signInLoading, setSignInLoading] = useState(false)
  const showLoginError = !signInLoading && signInError
  const [email, setEmail] = useState('')
  const [webfingerResponse, setWebfingerResponse] = useState<{
    success: boolean
    enforced: boolean
    provider: string
    discovery_url?: string
    organization_id?: string
  } | null>(null)
  const [webfingerLoading, setWebfingerLoading] = useState(false)
  const { errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const redirect = searchParams?.get('redirect')
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const isValidEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const shouldShowPasswordField = (): boolean => {
    if (webfingerLoading || !webfingerResponse || !webfingerResponse.success) {
      return false
    }

    return webfingerResponse.provider === 'NONE' || (webfingerResponse.provider !== 'NONE' && !webfingerResponse.enforced)
  }

  const shouldShowSSOButton = (): boolean => {
    if (!webfingerResponse) {
      return false
    }

    return webfingerResponse.success && webfingerResponse.provider !== 'NONE' && webfingerResponse.enforced && !!webfingerResponse.organization_id
  }

  const handleSSOLogin = async () => {
    if (!webfingerResponse?.organization_id) {
      return false
    }

    localStorage.setItem('sso_organization_id', webfingerResponse.organization_id)

    try {
      const response = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: webfingerResponse.organization_id,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success && data.redirect_uri) {
        window.location.href = data.redirect_uri
        return true
      }

      if (!data.success) {
        errorNotification({ title: data.message || 'SSO login failed' })
        return false
      }

      console.error('SSO login failed:', data)
      setSignInError(true)
      setSignInErrorMessage('SSO login failed. Please try again.')
      return false
    } catch (error) {
      console.error('SSO login error:', error)
      setSignInError(true)
      setSignInErrorMessage('An error occurred during SSO login.')
      return false
    }
  }

  const checkLoginMethods = async (email: string) => {
    if (!isValidEmail(email)) {
      return
    }

    try {
      setWebfingerLoading(true)
      const response = await fetch(`/api/auth/webfinger?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      console.log(data)
      setWebfingerResponse(data)
    } catch (error) {
      console.error('Error fetching webfinger:', error)
      setWebfingerResponse(null)
    } finally {
      setWebfingerLoading(false)
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

  const redirectUrl = useMemo(() => {
    if (token) {
      return `/invite?token=${token}`
    }
    if (redirect) {
      return redirect
    }

    return '/'
  }, [redirect, token])

  const submit = async (payload: LoginUser) => {
    setSignInLoading(true)
    setSignInError(false)

    try {
      if (shouldShowSSOButton()) {
        return
      }

      if (recaptchaSiteKey) {
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

      const res: SignInResponse = await signIn('credentials', {
        redirect: false,
        ...payload,
      })

      if (res.ok && !res.error) {
        router.push(redirectUrl)
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
        setSignInError(true)
      }
    } catch (error) {
      console.error('Login error:', error)
      setSignInErrorMessage('An unexpected error occurred.')
      setSignInError(true)
    } finally {
      setSignInLoading(false)
    }
  }

  /**
   * Setup Github Authentication
   */
  const github = async () => {
    await signIn('github', {
      redirectTo: redirectUrl,
    })
  }

  /**
   * Setup Google Authentication
   */
  const google = async () => {
    await signIn('google', {
      redirectTo: redirectUrl,
    })
  }

  /**
   * Setup Passkey SignIn
   */
  async function passKeySignIn() {
    try {
      setSignInError(false)
      setSignInErrorMessage('')

      const options = await getPasskeySignInOptions({
        email: email || '',
      })
      setSessionCookie(options.session)

      const assertionResponse = await startAuthentication({
        optionsJSON: {
          challenge: options?.publicKey?.challenge,
          rpId: options?.publicKey?.rpId,
          userVerification: 'required',
        },
      })

      const verificationResult = await verifyAuthentication({
        assertionResponse,
      })

      if (verificationResult.success) {
        await signIn('passkey', {
          callbackUrl: redirectUrl,
          email: email || '',
          session: verificationResult.session,
          accessToken: verificationResult.access_token,
          refreshToken: verificationResult.refresh_token,
        })
      } else {
        setSignInError(true)
        setSignInErrorMessage(`Error: ${verificationResult.error}`)
      }

      return verificationResult
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'name' in err) {
        const errorName = (err as { name: string }).name

        if (errorName === 'AbortError' || errorName === 'NotAllowedError') {
          console.error('Error during passkey login:', err)
          errorNotification({ title: 'User canceled the passkey login request' })
          return
        }
      }

      setSignInError(true)
      setSignInErrorMessage('An unexpected error occurred during passkey login')
    }
  }

  return (
    <>
      <div className="flex flex-col self-center">
        <p className="text-2xl font-medium">Login to your account</p>
        <p className="text-base mt-8">Connect to Openlane with</p>

        <div className={buttons()}>
          <Button className="bg-card !px-3.5" variant="outlineLight" size="md" icon={<GoogleIcon />} iconPosition="left" onClick={() => google()} disabled={signInLoading}>
            <p className="text-sm font-normal">Google</p>
          </Button>

          <Button className="bg-card !px-3.5" variant="outlineLight" size="md" icon={<Github className="text-input-text" />} iconPosition="left" onClick={() => github()} disabled={signInLoading}>
            <p className="text-sm font-normal">GitHub</p>
          </Button>

          <Button className="bg-card !px-3.5" variant="outlineLight" icon={<KeyRoundIcon className="text-input-text" />} iconPosition="left" onClick={() => passKeySignIn()} disabled={signInLoading}>
            <p className="text-sm font-normal">Passkey</p>
          </Button>
        </div>

        <Separator label="or, login with your email" login className={separator()} />

        <SimpleForm
          classNames={form()}
          onSubmit={(e: LoginUser) => {
            submit(e)
          }}
          onChange={(e: { username: string }) => {
            setEmail(e.username)
            if (e.username && isValidEmail(e.username)) {
              debouncedCheckLoginMethods(e.username)
            } else {
              setWebfingerResponse(null)
            }
          }}
        >
          <div className={input()}>
            <Input type="email" variant="light" name="username" placeholder="Enter your email" className="bg-transparent !text-text" />
          </div>

          {shouldShowSSOButton() && (
            <div className="flex flex-col">
              <button
                className="p-4 text-button-text bg-brand justify-center items-center rounded-md text-sm h-10 font-bold flex mt-2 hover:opacity-90 transition"
                type="button"
                onClick={handleSSOLogin}
                disabled={signInLoading || webfingerLoading}
              >
                <span>Continue with SSO</span>
                <ArrowRightCircle size={16} className="ml-2" />
              </button>
            </div>
          )}

          {shouldShowPasswordField() && (
            <>
              <div className="flex flex-col">
                {
                  <>
                    <div className={input()}>
                      <PasswordInput variant="light" name="password" placeholder="password" autoComplete="current-password" className="bg-transparent !text-text" />
                    </div>
                    <Link href="/forgot-password" className=" text-base text-xs text-blue-500 mt-1 mb-1 text-right  hover:opacity-80 transition">
                      Forgot password?
                    </Link>
                    <button className="p-4 text-button-text bg-brand justify-between items-center rounded-md text-sm h-10 font-bold flex mt-2" type="submit" disabled={signInLoading}>
                      <span>Login</span>
                      <ArrowRightCircle size={16} />
                    </button>
                  </>
                }

                <span
                  onClick={() => !signInLoading}
                  className="text-sm text-gray-600 hover:text-gray-800 mt-2 mx-auto block cursor-pointer select-none"
                  style={{ opacity: signInLoading ? 0.5 : 1 }}
                ></span>
              </div>
            </>
          )}
          <div className="flex text-base">
            <span>New to Openlane? &nbsp;</span>
            <Link href={`/signup${token ? `?token=${token}` : ''}`} className="text-base text-blue-500 hover:opacity-80 transition">
              Sign up for an account
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
        {showLoginError && <MessageBox className={'p-4 ml-1'} message={signInErrorMessage} />}
      </div>
    </>
  )
}
