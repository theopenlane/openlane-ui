import React from 'react'
import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert'
import StatusCard from '@/components/pages/protected/policies/cards/status-card.tsx'

type TEditPolicyProps = {
  policyId: string
}

const EditPolicy: React.FC<TEditPolicyProps> = ({ policyId }) => {
  return (
    <div className="flex w-full">
      <div className="w-[80%]">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Not sure what to write?</AlertTitle>
          <AlertDescription>
            <p>
              For template library and help docs, please refer to our{' '}
              <a className="text-blue-600" href="https://docs.theopenlane.io/docs/category/policies-and-procedures" target="_blank">
                documentation
              </a>
              .
            </p>
          </AlertDescription>
        </Alert>
      </div>
      <div className="w-[20%]">
        <StatusCard />
      </div>
    </div>
  )
}

export default EditPolicy
