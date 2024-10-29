'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleForm } from '@repo/ui/simple-form'
import { MessageBox } from '@repo/ui/message-box'
import { Button } from '@repo/ui/button'
import { ArrowUpRight, KeyRoundIcon } from 'lucide-react'
import {
  getPasskeyRegOptions,
  registerUser,
  verifyRegistration,
  type RegisterUser,
} from '@/lib/user'
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

const TEMP_PASSKEY_EMAIL = 'tempuser@test.com'
const TEMP_PASSKEY_NAME = 'Temp User'

export const SignupPage = () => {
  const router = useRouter()
  const [signInError, setSignInError] = useState(false)
  const [registrationErrorMessage, setRegistrationErrorMessage] = useState(
    'There was an error. Please try again.',
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const showLoginError = !isLoading && signInError
  const [isPasswordActive, setIsPasswordActive] = useState(false)
  const { separator, buttons, keyIcon, form, input } = signupStyles()

  /**
   * Setup Github Authentication
   */
  const github = async () => {
    await signIn('github', {
      redirect: false,
    })
  }

  /**
   * Setup Google Authentication
   */
  const google = async () => {
    await signIn('google', {
      redirect: false,
    })
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
        setSignInError(true)
        setRegistrationErrorMessage(`Error: ${verificationResult.error}`)
      }

      return verificationResult
    } catch (error) {
      setSignInError(true)
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
          Sign up with Google
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
          Sign up with GitHub
        </Button>

        <Button
          variant="outlineLight"
          size="md"
          icon={<KeyRoundIcon className={keyIcon()} />}
          iconPosition="left"
          onClick={registerPassKey}
        >
          Sign up with PassKey
        </Button>
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

          try {
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
            setRegistrationErrorMessage('Unknown error. Please try again.')
          } finally {
            setIsLoading(false)
          }
        }}
      >
        <div className={input()}>
          <Label htmlFor="username">Email</Label>
          <Input
            name="email"
            placeholder="email@domain.net"
            required
            type="email"
          />
        </div>
        {isPasswordActive && (
          <>
            <div className={input()}>
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                name="password"
                placeholder="password"
                required
              />
            <PasswordInput
              name="confirmedPassword"
              placeholder="confirm password"
              required
            />
            </div>
          </>
        )}
        <Button
          className="mr-auto mt-2 w-full"
          icon={<ArrowUpRight />}
          size="md"
          type="submit"
          iconAnimated
        >
          {isLoading ? 'loading' : 'Sign up'}
        </Button>
      </SimpleForm>
      {showLoginError && (
        <MessageBox className={'p-4 ml-1'} message={registrationErrorMessage} />
      )}
    </div>
  )
}
