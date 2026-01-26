'use client'

import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { MessageBox } from '@repo/ui/message-box'
import { ArrowUpRight } from 'lucide-react'
import { loginStyles } from '@/components/pages/auth/login/login.styles'
import Link from 'next/link'
import { openlaneAPIUrl, recaptchaSiteKey } from '@repo/dally/auth'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '@/app/(auth)/login/page.styles'
import { Logo } from '@repo/ui/logo'
import { secureFetch } from '@/lib/auth/utils/secure-fetch'

export default function ForgotPasswordComponent() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const { form, input } = loginStyles()
  const { successNotification } = useNotification()
  const { content, logo } = pageStyles()

  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (cooldown > 0) {
      return
    }

    let recaptchaToken = ''

    if (recaptchaSiteKey) {
      recaptchaToken = await grecaptcha.execute(recaptchaSiteKey, { action: 'forgot_password' })
      const validationRes = await fetch('/api/recaptchaVerify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken }),
      })

      const validationData = await validationRes.json()
      if (!validationData.success) {
        setError('reCAPTCHA validation failed.')
        return
      }
    }

    try {
      const res = await secureFetch(`${openlaneAPIUrl}/v1/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
      } else {
        successNotification({ title: 'Check your email for the reset link.' })
        setCooldown(60)
      }
    } catch {
      setError('Failed to send reset email.')
    }
  }

  return (
    <div className={content()}>
      <div className={logo()}>
        <Logo width={300} theme="light" />
      </div>
      <div className="flex flex-col mt-2 justify-start">
        <form onSubmit={handleSubmit} className={form()}>
          <hr />
          <span>
            <p className="text-xl text-logo-dark font-medium mb-2 text-left">Reset your password</p>
            <p className="text-sm text-logo-dark text-left mb-4">Enter your email address and we will send you a link to reset your password.</p>
          </span>
          <div className={input()}>
            <Label htmlFor="email  " className="text-logo-dark">
              Email*
            </Label>
            <Input
              type="email"
              name="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="light"
              className="!border-neutral-300 dark:!border-neutral-300 text-logo-dark"
            />
          </div>

          <Button variant="primary" type="submit" icon={<ArrowUpRight />} iconAnimated className="mt-2 w-full" disabled={cooldown > 0}>
            {cooldown > 0 ? `Try again in ${cooldown}s` : 'Send Reset Link'}
          </Button>
        </form>

        {error && <MessageBox message={error} variant="error" className="mt-4" />}

        <Link href="/login" className="text-sm text-blue-500 underline mt-6 text-center hover:opacity-80 transition">
          Return to login
        </Link>
      </div>
    </div>
  )
}
