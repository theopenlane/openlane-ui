import React from 'react'
import { Panel } from '@repo/ui/panel'

interface InfoPanelProps {
  className?: string
  children?: React.ReactNode
  [key: string]: any // To allow any additional props (if needed)
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ className = '', children, ...props }) => {
  return (
    <Panel className={`@container p-0 ${className}`} {...props}>
      <div className="flex flex-col divide-y @md:flex-row @md:divide-x @md:divide-y-0 divide-oxford-blue-100 dark:divide-oxford-blue-900 *:px-4 *:py-2">{children}</div>
    </Panel>
  )
}

interface InfoPanelSectionProps {
  heading: string
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const InfoPanelSection: React.FC<InfoPanelSectionProps> = ({ heading, icon, children, ...props }) => {
  return (
    <div>
      <h3 className="text-oxford-blue-500 text-sm mb-1">
        <span className="flex items-center">
          {heading} {icon}
        </span>
      </h3>
      <h2>{children}</h2>
    </div>
  )
}
