'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@repo/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { toast } from '@repo/ui/use-toast'

const QRCodeDialog = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [otpValue, setOtpValue] = useState('') // Track the OTP input
  const [isSubmitting, setIsSubmitting] = useState(false)

  const otpAuthUrl = 'otpauth://totp/theopenlane.io:openlane-cloud2@theopenlane.io?algorithm=SHA1&digits=6&issuer=theopenlane.io&period=30&secret=YWZG7FUST3ST2PIS7JSOOSA2N4WDXKH'

  const verifyOTP = async (otp: string) => {
    try {
      const response = await fetch('/api/verifyOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: 'OTP validated successfully', variant: 'success' })
      } else {
        toast({ title: 'OTP validation failed', description: data.message, variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error during OTP validation:', error)
      toast({ title: 'An error occurred', variant: 'destructive' })
    }
  }

  const handleOtpChange = async (value: string) => {
    setOtpValue(value)

    // Trigger verification when OTP has 6 digits
    if (value.length === 6) {
      setIsSubmitting(true)
      try {
        await verifyOTP(value) // Call the verify function passed as a prop
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Show QR Code</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan this QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Render QR Code */}
          <QRCodeSVG value={otpAuthUrl} size={180} className="shadow-lg" />
          <p className="text-sm text-gray-500">Use your authenticator app to scan this QR code.</p>
          {/* OTP Input */}
          <InputOTP maxLength={6} onChange={handleOtpChange} containerClassName="gap-2">
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator />
          </InputOTP>
          {isSubmitting && <p className="text-sm text-gray-500">Validating OTP...</p>}
          {/* Close button */}
          <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QRCodeDialog
