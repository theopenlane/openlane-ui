'use client'
import { useNotification } from '@/hooks/useNotification'
import { useUserSelectEmail } from '@/lib/graphql-hooks/members'
import { useTransferOrganizationOwnership } from '@/lib/graphql-hooks/organization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { UsersRound } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import React, { useMemo, useState } from 'react'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TransferOwnershipDialogProps = {
  trigger?: React.ReactNode
}

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({ trigger }: TransferOwnershipDialogProps) => {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const { mutateAsync: transferOwnership } = useTransferOrganizationOwnership()
  const { userOptions } = useUserSelectEmail({})
  const { successNotification, errorNotification } = useNotification()

  const filteredOptions = useMemo(() => {
    return userOptions.filter((user) => user.label.toLowerCase().includes(email.toLowerCase())) ?? []
  }, [userOptions, email])

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }
  const handleEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setEmail(val)

    if (val && filteredOptions.length > 0) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleSelectOption = (label: string) => {
    setEmail(label)
    setShowDropdown(false)
  }

  const handleTransferOwnership = async () => {
    if (!email || !isValidEmail(email)) {
      errorNotification({
        title: 'Invalid email',
      })
      return
    }
    try {
      const response = await transferOwnership({
        newOwnerEmail: email,
      })

      const invitationSent = response.transferOrganizationOwnership.invitationSent

      if (invitationSent) {
        successNotification({
          title: 'Ownership transfer initiated',
          description: 'An invitation has been sent to the new owner.',
        })
      } else {
        successNotification({
          title: 'Ownership transferred',
          description: 'Ownership transferred successfully.',
        })
      }

      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleCancel = () => {
    setOpen(false)
    setEmail('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setEmail('')
          setShowDropdown(false)
        }
      }}
    >
      <DialogTrigger asChild>
        {!trigger ? (
          <Button className="h-8! p-2!" variant="destructive" type="button" icon={<UsersRound />} iconPosition="left">
            Transfer ownership
          </Button>
        ) : (
          trigger
        )}
      </DialogTrigger>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer ownership</DialogTitle>
          <DialogDescription>
            <p className="mt-2 text-sm font-normal">
              Ownership transfers instantly for existing organization members. If the user isn&#39;t in the organization yet, they&#39;ll get an email to join and accept the ownership transfer.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Input placeholder="Email" value={email} onChange={handleEmailInput} className="mb-2" />

          {showDropdown && filteredOptions.length > 0 && (
            <div role="listbox" className="absolute left-0 right-0 mt-1 z-50 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
              {filteredOptions.map((opt) => {
                const selected = email === opt.label
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelectOption(opt.label)}
                    className={cn('flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm hover:bg-muted', selected && 'bg-muted font-medium')}
                  >
                    <div className="relative h-4 w-4 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full border border-primary" />
                      {selected && <div className="absolute h-1 w-1 rounded-full bg-primary" />}
                    </div>
                    {opt.label}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <DialogFooter className="mt-7 flex gap-2">
          <Button disabled={!email || !isValidEmail(email)} onClick={handleTransferOwnership}>
            Transfer
          </Button>
          <CancelButton onClick={handleCancel}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
