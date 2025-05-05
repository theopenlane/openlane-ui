import { CircleArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import React from 'react'

const ProtectedArea: React.FC = () => {
  return (
    <div className="min-h-screen flex m-[146px]">
      <div className=" px-4 w-[607px]">
        <div className="flex  mb-6 space-x-4">
          <div className="w-10 h-10 rounded-full flex text-2xl"></div>
          <div className="w-16 h-16 rounded-md flex text-3xl"></div>
        </div>
        <p className="text-3xl font-semibold mb-3 leading-9">This page is part of a protected area, and it looks like your account doesn't have permission to enter right meow.</p>
        <p className="text-sm mb-6">
          If you think this is a mistake,{' '}
          <a href="#" className="underline">
            reach out to your org owner
          </a>{' '}
          or{' '}
          <a href="#" className="underline">
            contact support
          </a>
          .
        </p>
        <Button icon={<CircleArrowLeft />} iconPosition="left">
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default ProtectedArea
