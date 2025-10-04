'use client'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { UserPlus, Clock, Lightbulb } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'

export default function SOC2Step2() {
  const [showInviteForm, setShowInviteForm] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Team setup</h2>
        <p className="text-sm text-muted-foreground">Want to invite team members now?</p>
      </div>

      {!showInviteForm ? (
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="h-28" onClick={() => setShowInviteForm(true)}>
            <div className="flex flex-col items-center justify-center gap-1">
              <UserPlus className="!h-5 !w-5" size={20} />
              <span>Add teammates now</span>
            </div>
          </Button>
          <Button type="button" variant="outline" className="h-28" onClick={() => setShowInviteForm(true)}>
            <div className="flex flex-col items-center justify-center gap-1">
              <Clock className="!h-5 !w-5" size={20} />
              <span>I&apos;ll do this later</span>
            </div>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <Card className="p-4 flex flex-col items-start gap-3 border-tip-border bg-tip-background">
              <div className="flex gap-2 items-center">
                <Lightbulb className="text-tip-text mt-0.5" size={20} />
                <span className="text-sm text-tip-text">Tips</span>
              </div>
              <p className="text-sm text-tip-text">
                Admins have complete control to manage program data, while members can only edit their assigned sections. Groups with Edit Access can both read and write, whereas those with Read-Only
                Access can only view the information.
              </p>
            </Card>

            <div className="space-y-4">
              {['Program Admins', 'Program Members', 'Groups with Edit Access', 'Groups with Read Only Access'].map((label) => (
                <div key={label}>
                  <label className="text-sm mb-1 block">{label}</label>
                  <input type="text" placeholder="Search users..." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
