'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@repo/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@repo/ui/input-otp'
import { toast } from '@repo/ui/use-toast'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { Copy } from 'lucide-react'
import { useUpdateTfaSetting } from '@/lib/graphql-hooks/tfa'
import { useQueryClient } from '@tanstack/react-query'

interface QRCodeProps {
  qrcode: string | null
  secret: string | null
  refetch: () => void
  onClose: () => void
  regeneratedCodes: null | string[]
}

const QRCodeDialog = ({ qrcode, secret, refetch, onClose, regeneratedCodes }: QRCodeProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const [otpValue, setOtpValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [isSecretKeySetup, setIsSecretKeySetup] = useState<boolean>(false)
  const [modalClosable, setModalClosable] = useState(true)
  const queryClient = useQueryClient()

  const { mutateAsync: updateTfaSetting } = useUpdateTfaSetting()

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
        const data = await updateTfaSetting({
          input: {
            verified: true,
          },
        })
        setRecoveryCodes(data?.updateTFASetting.recoveryCodes || null)
        setModalClosable(false)

        queryClient.invalidateQueries({ queryKey: ['tfaSettings'] })
        queryClient.invalidateQueries({ queryKey: ['userTFASettings'] })
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
    const codes = recoveryCodes || regeneratedCodes
    if (codes) {
      const blob = new Blob([codes.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'recovery-codes.txt'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setModalClosable(true)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen)
    if (!isOpen) {
      resetState()
      onClose()
    }
  }

  useEffect(() => {
    if (copiedText) {
      toast({
        title: 'Copied to clipboard',
        variant: 'success',
      })
      setModalClosable(true)
    }
  }, [copiedText])

  const config = useMemo(() => {
    const codes = recoveryCodes || regeneratedCodes
    if (codes) {
      return {
        title: 'Use recovery codes for login if you lose access to your authenticator',
        body: (
          <>
            <div className="grid grid-cols-4 gap-2">
              {codes.map((rc) => (
                <p key={rc}>{rc}</p>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => copyToClipboard(codes.join(' '))}>Copy Recovery Codes</Button>
              <Button onClick={handleDownloadRecoveryCodes}>Download Recovery Codes</Button>
            </div>
          </>
        ),
      }
    } else {
      return {
        title: 'Scan this QR Code',
        body: (
          <>
            <p className="text-sm ">Use your authenticator app to scan this QR code.</p>
            {qrcode && <QRCodeSVG value={qrcode} size={180} className="shadow-lg" />}

            {isSecretKeySetup ? (
              <div className="flex flex-col gap-1 items-center">
                <p>Configure your authenticator app manually using this code:</p>
                <div className="flex items-center gap-1">
                  <p>{secret}</p>
                  {secret && <Copy width={16} height={16} className={'text-accent-secondary-muted cursor-pointer'} onClick={() => copyToClipboard(secret)} />}
                </div>
              </div>
            ) : (
              <div className="flex">
                <p className="text-sm ">Unable to scan? You can use the &nbsp; </p>
                <p onClick={() => setIsSecretKeySetup(true)} className="text-sm underline text-accent-secondary cursor-pointer ">
                  setup key
                </p>
                <p className="text-sm "> &nbsp;to manually configure your authenticator app.</p>
              </div>
            )}

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
  }, [handleOtpChange, handleDownloadRecoveryCodes, recoveryCodes, regeneratedCodes])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px]" isClosable={modalClosable}>
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
