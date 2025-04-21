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
import { pageStyles } from '../login/page.styles'
import { Logo } from '@repo/ui/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const { form, input } = loginStyles()
  const { successNotification } = useNotification()
  const { bg, content, logo } = pageStyles()

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
      // @ts-ignore
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
      const res = await fetch(`${openlaneAPIUrl}/v1/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      console.log(res)

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
      <div className="flex flex-col mt-8 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className={form()}>
          <p className="text-xl text-logo-dark text-border font-semibold mb-4 text-center">Reset your password</p>
          <div className={input()}>
            <Label htmlFor="email  " className="text-text-dark">
              Email address
            </Label>
            <Input
              type="email"
              name="email"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              variant="light"
              className="!border-neutral-300 dark:!border-neutral-300"
            />
          </div>

          <Button type="submit" icon={<ArrowUpRight />} iconAnimated className="mt-2 w-full" disabled={cooldown > 0}>
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
