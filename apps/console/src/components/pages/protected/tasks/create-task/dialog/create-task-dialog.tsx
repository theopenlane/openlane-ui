'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import CreateTaskForm from '@/components/pages/protected/tasks/create-task/form/create-task-form'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'

const CreateTaskDialog = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const handleSuccess = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<PlusCircle />} iconPosition="left" onClick={() => setIsOpen(true)}>
          Create a new Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskDialog }
