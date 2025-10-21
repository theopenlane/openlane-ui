'use client'

import { LoginUser } from '@repo/dally/user'
import { Button } from '@repo/ui/button'
import MessageBox from '@repo/ui/message-box'
import SimpleForm from '@repo/ui/simple-form'
import { ArrowRightCircle, KeyRoundIcon } from 'lucide-react'
import { signIn, SignInResponse } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const [email, setEmail] = useState('')
  const [webfingerResponse, setWebfingerResponse] = useState<{
    success: boolean
    enforced: boolean
    provider: string
    discovery_url?: string
    organization_id?: string
    is_org_owner?: boolean
  } | null>(null)
  const [webfingerLoading, setWebfingerLoading] = useState(false)
  const [usePasswordInsteadOfSSO, setUsePasswordInsteadOfSSO] = useState(false)
  const { errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const redirect = searchParams?.get('redirect')
  const urlErrorMessage = searchParams.get('error')
  const showLoginError = !signInLoading && signInError

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const isValidEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const shouldShowPasswordField = useCallback((): boolean => {
    if (!webfingerResponse) {
      return false
    }

    if (!webfingerResponse.success) {
      return true
    }

    // if SSO is not enforced, always show password field
    if (!webfingerResponse.enforced || webfingerResponse.provider === 'NONE') {
      return true
    }

    // if SSO is enforced and the user is an org admin,
    // show password field only if they chose to use password
    if (webfingerResponse.enforced && webfingerResponse.is_org_owner) {
      return usePasswordInsteadOfSSO
    }

    // if SSO is enforced and the user is not an org admin, don't show password field
    return false
  }, [webfingerResponse, usePasswordInsteadOfSSO])

  const shouldShowSSOButton = useCallback((): boolean => {
    if (!webfingerResponse) {
      return false
    }

    // only show SSO button when it is enforced
    if (webfingerResponse.enforced && webfingerResponse.provider !== 'NONE' && webfingerResponse.organization_id) {
      // but if the user is the org admin and chooses to use password, don't show SSO button
      if (webfingerResponse.is_org_owner && usePasswordInsteadOfSSO) {
        return false
      }
      return webfingerResponse.success
    }

    // don't show SSO button when SSO is not enforced
    return false
  }, [webfingerResponse, usePasswordInsteadOfSSO])

  const shouldShowToggleOption = useCallback((): boolean => {
    return Boolean(webfingerResponse?.enforced && webfingerResponse?.is_org_owner && webfingerResponse?.provider !== 'NONE' && webfingerResponse?.organization_id)
  }, [webfingerResponse])

  const handleSSOLogin = useCallback(async () => {
    if (!webfingerResponse?.organization_id) {
      return false
    }

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
  }, [webfingerResponse, errorNotification])

  const checkLoginMethods = useCallback(async (email: string) => {
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
      setWebfingerResponse(data)
    } catch (error) {
      console.error('Error fetching webfinger:', error)
      setWebfingerResponse(null)
    } finally {
      setWebfingerLoading(false)
    }
  }, [])

  const debouncedCheckLoginMethods = useCallback(
    (email: string) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      debounceTimeout.current = setTimeout(() => checkLoginMethods(email), 500)
    },
    [checkLoginMethods],
  )

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

  const setDirectOAuthCookie = () => {
    const expires = new Date(Date.now() + 5 * 60 * 1000).toUTCString()
    document.cookie = `direct_oauth=true; path=/; expires=${expires}; SameSite=Lax`
  }

  const github = async () => {
    setDirectOAuthCookie()

    await signIn('github', {
      redirectTo: redirectUrl,
    })
  }

  const google = async () => {
    setDirectOAuthCookie()

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
        setDirectOAuthCookie()
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

  useEffect(() => {
    if (urlErrorMessage) {
      setSignInErrorMessage(urlErrorMessage)
      setSignInError(true)
      router.replace('/login')
    }
  }, [urlErrorMessage, router])

  return (
    <>
      <div className="flex flex-col self-center">
        <p className="text-2xl font-medium">Login to your account</p>
        <p className="text-base mt-8">Connect to Openlane with</p>

        <div className={buttons()}>
          <Button
            className="bg-secondary !px-3.5 hover:opacity-60 transition"
            variant="outlineLight"
            size="md"
            icon={<GoogleIcon />}
            iconPosition="left"
            onClick={() => google()}
            disabled={signInLoading}
          >
            <p className="text-sm font-normal">Google</p>
          </Button>

          <Button
            className="bg-secondary !px-3.5 hover:opacity-60 transition"
            variant="outlineLight"
            size="md"
            icon={<Github className="text-input-text" />}
            iconPosition="left"
            onClick={() => github()}
            disabled={signInLoading}
          >
            <p className="text-sm font-normal">GitHub</p>
          </Button>

          <Button
            className="bg-secondary !px-3.5 hover:opacity-60 transition"
            variant="outlineLight"
            icon={<KeyRoundIcon className="text-input-text" />}
            iconPosition="left"
            onClick={() => passKeySignIn()}
            disabled={signInLoading}
          >
            <p className="text-sm font-normal">Passkey</p>
          </Button>
        </div>

        <Separator label="or, login with your email" login className={separator()} />

        <SimpleForm
          classNames={form()}
          onSubmit={(e: LoginUser) => {
            submit(e)
          }}
          onChange={(e: { username: string; password?: string }) => {
            if (e.username !== undefined && e.username !== email) {
              setEmail(e.username)
              // reset toggle when email address changes until next webfinger api check
              setUsePasswordInsteadOfSSO(false)

              if (e.username && isValidEmail(e.username)) {
                debouncedCheckLoginMethods(e.username)
                return
              }

              setWebfingerResponse(null)
            }
          }}
        >
          <div className={input()}>
            <Input type="email" variant="light" name="username" placeholder="Enter your email" className="bg-transparent" />
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

              {shouldShowToggleOption() && (
                <div className="flex justify-end mt-2">
                  <div className="text-sm text-gray-400">
                    <button type="button" onClick={() => setUsePasswordInsteadOfSSO(true)} className="hover:text-gray-300 transition-colors">
                      Sign-in With Password
                    </button>
                  </div>
                </div>
              )}
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
                    <Button variant="primary" className="p-4 justify-between items-center rounded-md text-sm h-10 font-bold flex mt-2" type="submit" disabled={signInLoading}>
                      <span>Login</span>
                      <ArrowRightCircle size={16} />
                    </Button>
                    <Link href="/forgot-password" className="text-xs underline hover:text-blue-500 mt-1 mb-1 text-right hover:opacity-80 transition">
                      Forgot password?
                    </Link>
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
          {!shouldShowSSOButton() && !shouldShowPasswordField() && (
            <div className="flex text-base mt-4">
              <span>New to Openlane? &nbsp;</span>
              <Link href={`/signup${token ? `?token=${token}` : ''}`} className="text-base underline hover:text-blue-500 hover:opacity-80 transition">
                Sign up for an account
              </Link>
            </div>
          )}
        </SimpleForm>

        <div className="text-xs opacity-90 flex gap-1 mt-9">
          By signing in, you agree to our
          <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`} className="text-xs underline hover:text-blue-500 hover:opacity-80 transition">
            Terms of Service
          </Link>{' '}
          and
          <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`} className="text-xs underline hover:text-blue-500 hover:opacity-80 transition">
            Privacy Policy
          </Link>
        </div>

        {showLoginError && <MessageBox className={'p-4 ml-1'} message={signInErrorMessage} />}
      </div>
    </>
  )
}
