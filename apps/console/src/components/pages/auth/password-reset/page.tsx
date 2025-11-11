'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { MessageBox } from '@repo/ui/message-box'
import { Logo } from '@repo/ui/logo'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { useNotification } from '@/hooks/useNotification'
import { loginStyles } from '@/components/pages/auth/login/login.styles'
import { pageStyles } from '@/app/(auth)/login/page.styles'
import { PasswordInput } from '@repo/ui/password-input'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export default function PasswordResetPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()
  const { form, input } = loginStyles()
  const { content, logo } = pageStyles()
  const { successNotification, errorNotification } = useNotification()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Reset token is missing.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await secureFetch(`${openlaneAPIUrl}/v1/password-reset`, {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Something went wrong.')
      } else {
        successNotification({ title: 'Your password has been reset.' })
        router.push('/login')
      }
    } catch {
      setError('Failed to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }
  useEffect(() => {
    if (!token) {
      requestAnimationFrame(() => {
        errorNotification({
          title: 'Reset link is invalid or expired',
        })
      })
    }
  }, [token, errorNotification])

  return (
    <div className={content()}>
      <div className={logo()}>
        <Logo width={300} theme="light" />
      </div>
      <div className="flex flex-col mt-2 justify-start">
        <form onSubmit={handleSubmit} className={form()}>
          <hr />
          <span>
            <p className="text-xl text-logo-dark font-medium mb-4 text-left">Choose a new password</p>
            <p className="text-sm text-logo-dark text-left mb-4">Please enter a new password for your account.</p>
          </span>
          <div className={input()}>
            <Label htmlFor="password" className="text-logo-dark">
              New password*
            </Label>
            <PasswordInput
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              variant="light"
              placeholder="password"
              className="!border-neutral-300 dark:!border-neutral-300 text-logo-dark"
            />
          </div>

          <div className={input()}>
            <Label htmlFor="confirmPassword" className="text-logo-dark">
              Confirm password*
            </Label>
            <PasswordInput
              name="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              variant="light"
              placeholder="confirm password"
              className="!border-neutral-300 dark:!border-neutral-300 text-logo-dark"
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>

        {error && <MessageBox message={error} variant="error" className="mt-4" />}
      </div>
    </div>
  )
}
