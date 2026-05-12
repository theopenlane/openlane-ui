const RECAPTCHA_MIN_SCORE = 0.2

export async function verifyRecaptchaToken(token: string): Promise<{ success: boolean; score?: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured')
    return { success: false }
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: secretKey, response: token }),
  })

  const data = await response.json()

  if (data.success && data.score >= RECAPTCHA_MIN_SCORE) {
    return { success: true, score: data.score }
  }

  return { success: false, score: data.score }
}
