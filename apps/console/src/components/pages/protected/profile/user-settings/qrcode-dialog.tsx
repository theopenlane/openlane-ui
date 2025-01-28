'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@repo/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { toast } from '@repo/ui/use-toast'
import { useUpdateTfaSettingMutation } from '@repo/codegen/src/schema'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { Copy } from 'lucide-react'

interface QRCodeProps {
  qrcode: string
  secret: string
  refetch: () => void
  onClose: () => void
}

const QRCodeDialog = ({ qrcode, secret, refetch, onClose }: QRCodeProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [isSecretKeySetup, setIsSecretKeySetup] = useState<boolean>(false)

  const [{ fetching: isTfaSubmitting }, updateTfaSetting] = useUpdateTfaSettingMutation()

  const [copiedText, copyToClipboard] = useCopyToClipboard()

  const resetState = () => {
    setTimeout(() => {
      setRecoveryCodes(null)
      setIsSecretKeySetup(false)
    }, 300)
  }
  const verifyOTP = async (otp: string) => {
    try {
      const response = await fetch('/api/verifyOTP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totp_code: otp }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: 'OTP validated successfully', variant: 'success' })
        const { data } = await updateTfaSetting({
          input: {
            verified: true,
          },
        })
        setRecoveryCodes(data?.updateTFASetting.recoveryCodes || null)
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

    if (value.length === 6) {
      setIsSubmitting(true)
      try {
        await verifyOTP(value)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDownloadRecoveryCodes = () => {
    if (recoveryCodes) {
      const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'recovery-codes.txt'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      handleOpenChange(false)
      refetch()
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen)
    if (!isOpen) {
      resetState()
      onClose()
    }
  }

  const config = useMemo(() => {
    if (recoveryCodes) {
      return {
        title: 'Use recovery codes for login if you lose access to your authenticator',
        body: (
          <>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((rc) => (
                <p key={rc}>{rc}</p>
              ))}
            </div>
            <Button onClick={handleDownloadRecoveryCodes}>Download Recovery Codes</Button>
          </>
        ),
      }
    } else if (isSecretKeySetup) {
      return {
        title: 'Authenticate manually with the secret key',
        body: (
          <div className="flex flex-col items-center">
            <p>Account name: Openlane</p>
            <div className="flex items-center gap-2">
              <p>Secret key: {secret}</p>
              <Copy width={16} height={16} className={'text-accent-secondary-muted cursor-pointer'} onClick={() => copyToClipboard(secret)} />
            </div>

            <InputOTP maxLength={6} onChange={handleOtpChange} containerClassName="gap-2 mt-4">
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
            </InputOTP>
            <Button
              className="mt-4"
              onClick={() => {
                handleOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Close
            </Button>
          </div>
        ),
      }
    } else {
      return {
        title: 'Scan this QR Code',
        body: (
          <>
            <p className="text-sm ">Use your authenticator app to scan this QR code.</p>
            <QRCodeSVG value={qrcode} size={180} className="shadow-lg" />
            <div className="flex">
              <p className="text-sm ">Unable to scan? You can use the &nbsp; </p>
              <p onClick={() => setIsSecretKeySetup(true)} className="text-sm underline text-accent-secondary cursor-pointer ">
                setup key
              </p>
              <p className="text-sm "> &nbsp;to manually configure your authenticator app.</p>
            </div>
            <InputOTP maxLength={6} onChange={handleOtpChange} containerClassName="gap-2">
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
            </InputOTP>
            <Button onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Close
            </Button>
          </>
        ),
      }
    }
  }, [handleOtpChange, handleDownloadRecoveryCodes, recoveryCodes])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent isClosable={!recoveryCodes}>
        <DialogHeader>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4">
          {config.body}
          {isSubmitting && <p className="text-sm text-gray-500">Validating OTP...</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QRCodeDialog
