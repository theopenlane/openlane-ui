import { Plus, SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'

export const CreateBtn = (
  <Button variant="primary" className="h-8 !px-2 !pl-3" icon={<SquarePlus />} iconPosition="left">
    Create
  </Button>
)

export const CreateBtnIcon = (
  <Button variant="primary" className={`p-1 rounded-md h-8 w-8 items-center justify-center flex`}>
    <Plus size={16} />
  </Button>
)
