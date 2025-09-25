import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'

export const CreateBtn = (
  <Button variant="outline" className="h-8 !px-2 !pl-3 btn-secondary" icon={<ChevronDown />}>
    Create
  </Button>
)

export const CreateBtnIcon = (
  <button className={`btn-secondary p-1 rounded-md`}>
    <Plus size={18} />
  </button>
)
