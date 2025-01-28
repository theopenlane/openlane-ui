import { CircleHelpIcon, KeyIcon, ShieldPlusIcon } from 'lucide-react'

export const examplePrompts = [
  {
    text: (
      <>
        <div className="flex">
          <KeyIcon className="pr-2" />
          What is a control objective?
        </div>
      </>
    ),
    prompt: 'Define a control objective in the context of risk management.',
  },
  {
    text: (
      <>
        <div className="flex">
          <ShieldPlusIcon className="pr-2" />
          What are the pillars of SOC2?
        </div>
      </>
    ),
    prompt: 'List the five pillars of SOC2 with a brief description of each.',
  },
  {
    text: (
      <>
        <div className="flex">
          <CircleHelpIcon className="pr-2" />
          Does ISO 27001 cover GDPR?
        </div>
      </>
    ),
    prompt: 'Does ISO 27001 cover GDPR compliance?',
  },
]
