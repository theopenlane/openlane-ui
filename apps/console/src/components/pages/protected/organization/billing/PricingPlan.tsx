import React from 'react'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { CircleCheck, ExternalLink } from 'lucide-react'

const PricingPlan = () => {
  return (
    <Panel className="p-6">
      <h2 className="text-2xl ">Pricing Plan</h2>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-10 w-full ">
          <h3 className="text-xl font-medium  w-1/5">Current Plan</h3>
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div>
                <p className="textl-gl font-medium ">Business Tier</p>
                <p className="text-sm">$250 / month</p>
              </div>
              <Button className=" flex items-center gap-2" icon={<ExternalLink />}>
                Change Subscription
              </Button>
            </div>
            {/* Divider */}
            <div className="my-7 border-t border-gray-300"></div>

            {/* Features List */}
            <h4 className="text-lg font-medium text-text-header mb-5">Features in this plan</h4>
            <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              {[
                'Compliance Standards and Templates',
                'Program Management',
                'Evidence Storage',
                'Centralized Audit Documentation',
                'Compliance Program Management',
                'SSO',
                'Questionnaire Automation',
                'Policy and Procedure Management',
                'Vendor Management',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CircleCheck className="w-5 h-5 text-brand" />
                  <p>{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default PricingPlan
