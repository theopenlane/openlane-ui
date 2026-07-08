'use client'

import { type LoginUser } from '@repo/dally/user'
import { Button } from '@repo/ui/button'
import { UserAuthProvider } from '@repo/codegen/src/schema'
import SimpleForm from '@repo/ui/simple-form'
import { ArrowRightCircle, Github, KeyRoundIcon } from 'lucide-react'
import { signIn, type SignInResponse } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { isValidEmail } from '@/lib/validators'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import { cn } from '@repo/ui/lib/utils'
import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'
import { recordLastLoginMethod, getLastLoginMethod } from '@/lib/auth/utils/last-login-method'
import { LastUsedBadge } from './last-used-badge'

type WebfingerResponse = {
  success: boolean
  enforced: boolean
  provider: string
  discovery_url?: string
  organization_id?: string
  is_org_owner?: boolean
}

export const LoginPage = () => {
  const { separator, buttons, form, input } = loginStyles()

  const router = useRouter()
  const [signInError, setSignInError] = useState(false)
  const [signInErrorMessage, setSignInErrorMessage] = useState('There was an error. Please try again.')
  const [signInLoading, setSignInLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [webfingerResponse, setWebfingerResponse] = useState<WebfingerResponse | null>(null)
  const [webfingerLoading, setWebfingerLoading] = useState(false)
  const [preferredMethod, setPreferredMethod] = useState<'sso' | 'password' | null>(null)
  // the method the user most recently signed in with, remembered per-device
  const [lastUsedProvider, setLastUsedProvider] = useState<UserAuthProvider | null>(null)
  const { errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')
  const redirect = searchParams?.get('redirect')
  const emailParam = searchParams?.get('email')
  const urlErrorMessage = searchParams.get('error')
  const showLoginError = !signInLoading && signInError

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // the user's last login was SSO (remembered as a flag on this device)
  const ssoLastUsed = lastUsedProvider === UserAuthProvider.OIDC

  // webfinger confirmed the currently typed email resolves to a usable SSO org
  const isSSOEmail = Boolean(webfingerResponse?.provider && webfingerResponse.provider !== 'NONE' && webfingerResponse.organization_id)

  // webfinger answered (non-null = real 200 body) but the email has no usable SSO — show password
  const webfingerSaysNoSSO = webfingerResponse !== null && !isSSOEmail

  // the only case without a password fallback is an enforced SSO org where the user isn't an admin
  const isSSOEnforcedForNonOwner = isSSOEmail && Boolean(webfingerResponse?.enforced) && !webfingerResponse?.is_org_owner
  const isPasswordAvailable = !isSSOEnforcedForNonOwner

  // What follows decides which login control to render. It works in three layers:
  //   1. availability  — is each method even an option for this email/device?
  //   2. default       — with no user choice, which method leads?
  //   3. preference     — the user can override the default via a "Switch to..." link.
  // The final show* flags combine all three.

  // --- Layer 1: availability ---
  // SSO is offerable when webfinger didn't rule it out AND either the email resolves to an SSO org
  // or this device last logged in with SSO (so we can surface the button before webfinger answers).
  const ssoAvailable = !webfingerSaysNoSSO && (isSSOEmail || ssoLastUsed)

  // --- Layer 2: which method leads by default ---
  // SSO leads when the org enforces it, or when this device's last login was SSO.
  const ssoIsDefault = (isSSOEmail && Boolean(webfingerResponse?.enforced)) || ssoLastUsed

  // Password leads when the email has no SSO at all, or when it's an SSO org that only *offers*
  // SSO (not enforced) — in that case we show password first and offer SSO as a switch.
  const passwordIsDefault = webfingerSaysNoSSO || (isSSOEmail && !ssoIsDefault)

  // --- Layer 3: honor the user's explicit "Switch to..." choice, but only if it's actually usable ---
  // (e.g. ignore a stale 'password' preference once we learn SSO is enforced with no password fallback).
  const preferenceIsAvailable = preferredMethod === 'sso' ? ssoAvailable : preferredMethod === 'password' ? isPasswordAvailable : true
  const activePreference = preferenceIsAvailable ? preferredMethod : null

  // --- Final visibility: show a method when it's available AND (the user picked it OR it's the default with no pick) ---
  const showSSOButton = ssoAvailable && (activePreference === 'sso' || (activePreference === null && ssoIsDefault))

  const showPasswordField = isPasswordAvailable && (activePreference === 'password' || (activePreference === null && passwordIsDefault))

  // Offer a switch link only when the *other* method is available but currently hidden.
  const showSwitchToPassword = !webfingerLoading && showSSOButton && isPasswordAvailable && !showPasswordField
  const showSwitchToSSO = !webfingerLoading && showPasswordField && ssoAvailable && !showSSOButton

  const handleSSOLogin = useCallback(async () => {
    // the button stays enabled even when webfinger can't resolve the email — error here, don't use a stale org
    if (!isSSOEmail || !webfingerResponse?.organization_id) {
      setSignInError(true)
      setSignInErrorMessage('Invalid email')
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
        recordLastLoginMethod(UserAuthProvider.OIDC)
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
  }, [webfingerResponse, errorNotification, isSSOEmail])

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

      // webfinger couldn't resolve this email (e.g. a mistype) — leave unresolved so the SSO button stays and a click reports "Invalid email"
      if (!response.ok) {
        setWebfingerResponse(null)
        return
      }

      setWebfingerResponse(await response.json())
    } catch (error) {
      console.error('Error fetching webfinger:', error)
      setWebfingerResponse(null)
    } finally {
      setWebfingerLoading(false)
    }
  }, [])

  const debouncedCheckLoginMethods = useCallback(
    (email: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      debounceTimeoutRef.current = setTimeout(() => checkLoginMethods(email), 500)
    },
    [checkLoginMethods],
  )

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setPreferredMethod(null)
    // a prior "Invalid email" error no longer applies once the address changes
    setSignInError(false)

    // let webfinger drive on edit; hold webfingerLoading across the debounce so the button can't be clicked mid-check
    if (value && isValidEmail(value)) {
      setWebfingerLoading(true)
      debouncedCheckLoginMethods(value)
      return
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    setWebfingerLoading(false)
    // no determination for an empty/partial email — the last-used SSO button (flag-driven) stays
    setWebfingerResponse(null)
  }

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setLastUsedProvider(getLastLoginMethod())
  }, [])

  const redirectUrl = useMemo(() => {
    if (token) {
      return `/invite?token=${token}`
    }
    return sanitizeLoginRedirect(redirect)
  }, [redirect, token])

  const submit = async (payload: LoginUser) => {
    setSignInLoading(true)
    setSignInError(false)

    try {
      // only block credential submit when SSO is the only available method
      if (showSSOButton && !showPasswordField) {
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
        recordLastLoginMethod(UserAuthProvider.CREDENTIALS)
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
    recordLastLoginMethod(UserAuthProvider.GITHUB)

    await signIn('github', {
      redirectTo: redirectUrl,
    })
  }

  const google = async () => {
    setDirectOAuthCookie()
    recordLastLoginMethod(UserAuthProvider.GOOGLE)

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
        recordLastLoginMethod(UserAuthProvider.WEBAUTHN)
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

  // prefill the email from an invite link and resolve sign-in methods on load
  useEffect(() => {
    if (emailParam && isValidEmail(emailParam)) {
      setEmail(emailParam)
      checkLoginMethods(emailParam)
    }
  }, [emailParam, checkLoginMethods])

  return (
    <>
      <div className="flex flex-col self-center text-center">
        <p className="text-3xl font-medium">Login to your account</p>
        {!showSSOButton && !showPasswordField && (
          <div className="mt-2 text-center">
            <span className="text-muted-foreground text-sm">Don’t have an account yet? </span>
            <Link href={`/signup${token ? `?token=${token}` : ''}`} className="text-sm hover:text-blue-500 hover:opacity-80 transition-color duration-500">
              Sign up
            </Link>
          </div>
        )}

        <div className={cn(buttons(), 'flex justify-center items-center mt-[32px]')}>
          <div className="relative">
            <LastUsedBadge provider={UserAuthProvider.GOOGLE} lastUsedProvider={lastUsedProvider} floating />
            <Button variant="secondary" className="!py-1.5 !px-5 " size="md" icon={<GoogleIcon />} iconPosition="left" onClick={() => google()} disabled={signInLoading}>
              <p className="text-sm font-normal">Google</p>
            </Button>
          </div>

          <div className="relative">
            <LastUsedBadge provider={UserAuthProvider.GITHUB} lastUsedProvider={lastUsedProvider} floating />
            <Button variant="secondary" className="!py-1.5 !px-5 " size="md" icon={<Github className="text-input-text" />} iconPosition="left" onClick={() => github()} disabled={signInLoading}>
              <p className="text-sm font-normal">GitHub</p>
            </Button>
          </div>

          <div className="relative">
            <LastUsedBadge provider={UserAuthProvider.WEBAUTHN} lastUsedProvider={lastUsedProvider} floating />
            <Button variant="secondary" className="!py-1.5 !px-5 " icon={<KeyRoundIcon className="text-input-text" />} iconPosition="left" onClick={() => passKeySignIn()} disabled={signInLoading}>
              <p className="text-sm font-normal">Passkey</p>
            </Button>
          </div>
        </div>

        <Separator label="or" login className={cn(separator(), 'text-muted-foreground')} />

        <SimpleForm
          classNames={form()}
          onSubmit={(e: LoginUser) => {
            submit(e)
          }}
        >
          <div className={input()}>
            <div className="flex items-center justify-between items-centeer">
              <p className="text-sm">Email</p>
              <LastUsedBadge provider={UserAuthProvider.CREDENTIALS} lastUsedProvider={lastUsedProvider} />
              {showSwitchToPassword && (
                <button
                  type="button"
                  onClick={() => setPreferredMethod('password')}
                  className="text-xs bg-unset text-muted-foreground underline hover:text-blue-500 mt-1 mb-1 text-right hover:opacity-80 transition-colors duration-500"
                >
                  Switch to password
                </button>
              )}
              {showSwitchToSSO && (
                <button
                  type="button"
                  onClick={() => setPreferredMethod('sso')}
                  className="text-xs bg-unset text-muted-foreground underline hover:text-blue-500 mt-1 mb-1 text-right hover:opacity-80 transition-colors duration-500"
                >
                  Sign in with SSO
                </button>
              )}
            </div>

            <Input
              type="email"
              variant="light"
              name="username"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              className={`bg-transparent ${showLoginError ? 'border border-toast-error-icon' : ''}`}
            />
            {showLoginError && <span className="text-xs text-toast-error-icon text-left">{signInErrorMessage}</span>}
          </div>

          {showSSOButton && (
            <div className="relative flex flex-col mt-[16px]">
              <LastUsedBadge provider={UserAuthProvider.OIDC} lastUsedProvider={lastUsedProvider} floating />
              <Button
                variant="primary"
                className="p-4 flex justify-center items-center text-center rounded-md text-sm h-[36px] font-bold"
                type="button"
                onClick={handleSSOLogin}
                disabled={signInLoading || webfingerLoading || !isValidEmail(email)}
              >
                <span>Continue with SSO</span>
                <ArrowRightCircle size={16} className="ml-2" />
              </Button>
            </div>
          )}

          {showPasswordField && (
            <>
              <div className="flex flex-col">
                {
                  <>
                    <div className={input()}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm">Password</p>
                        <Link href="/forgot-password" className="text-xs text-muted-foreground underline hover:text-blue-500 mt-1 mb-1 text-right hover:opacity-80 transition-colors duration-500">
                          Forgot password?
                        </Link>
                      </div>
                      <PasswordInput variant="light" name="password" placeholder="Enter your password" autoComplete="current-password" className="bg-transparent !text-text" />
                    </div>
                    <div className="flex flex-col">
                      <Button variant="primary" className="mt-[16px] p-4 flex justify-center items-center text-center rounded-md text-sm h-[36px] font-bold" type="submit" disabled={signInLoading}>
                        {' '}
                        <span>Login</span>
                      </Button>
                    </div>
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
        </SimpleForm>

        <div className="text-xs opacity-90 flex gap-1 mt-4 text-muted-foreground">
          By signing in, you agree to our
          <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`} className="text-xs underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500">
            Terms of Service
          </Link>{' '}
          and
          <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`} className="text-xs underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500">
            Privacy Policy
          </Link>
        </div>
      </div>
    </>
  )
}
