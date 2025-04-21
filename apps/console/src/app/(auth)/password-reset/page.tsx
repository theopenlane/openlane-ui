'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { MessageBox } from '@repo/ui/message-box'
import { Logo } from '@repo/ui/logo'
import { openlaneAPIUrl } from '@repo/dally/auth'
import { useNotification } from '@/hooks/useNotification'
import { loginStyles } from '@/components/pages/auth/login/login.styles'
import { pageStyles } from '../login/page.styles'

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
  const { successNotification } = useNotification()

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
      const res = await fetch(`${openlaneAPIUrl}/v1/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

  return (
    <div className={content()}>
      <div className={logo()}>
        <Logo width={300} theme="light" />
      </div>
      <div className="flex flex-col mt-8 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className={form()}>
          <p className="text-xl text-logo-dark text-border font-semibold mb-4 text-center">Choose a new password</p>

          <div className={input()}>
            <Label htmlFor="password" className="text-text-dark">
              New password
            </Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required variant="light" className="!border-neutral-300 dark:!border-neutral-300" />
          </div>

          <div className={input()}>
            <Label htmlFor="confirmPassword" className="text-text-dark">
              Confirm password
            </Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required variant="light" className="!border-neutral-300 dark:!border-neutral-300" />
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
