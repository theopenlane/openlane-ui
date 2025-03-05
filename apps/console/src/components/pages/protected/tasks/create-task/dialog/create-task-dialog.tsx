'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusCircle } from 'lucide-react'
import CreateTaskForm from '@/components/pages/protected/tasks/create-task/form/create-task-form'
import React from 'react'
import { Button } from '@repo/ui/button'

const CreateTaskDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button icon={<PlusCircle />} iconPosition="left">
          Create a new Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new Task</DialogTitle>
        </DialogHeader>
        <CreateTaskForm />
      </DialogContent>
    </Dialog>
  )
}

export { CreateTaskDialog }
