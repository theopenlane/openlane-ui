'use client'

import React from 'react'
import { Button } from '@repo/ui/button'

export const ProgramSettingsDangerZone = () => {
  return (
    <section className="flex gap-14 border-t pt-6">
      <div className="w-48 shrink-0">
        <h3 className="font-normal text-xl mb-2 ">Danger Zone</h3>
      </div>

      <div className="space-y-6 w-full">
        <div>
          <p className="text-base">
            Archiving a program will make it <strong>read-only</strong>. You can still view all content, but no changes or actions can be performed.
          </p>
          <Button variant="destructive" className="mt-2 h-8 !px-2">
            Archive
          </Button>
        </div>

        <div>
          <p className="text-base">
            Proceed with caution, deleting a program is <strong>permanent and irreversible</strong>.
          </p>
          <Button variant="destructive" className="mt-2 h-8 !px-2">
            Delete
          </Button>
        </div>
      </div>
    </section>
  )
}
