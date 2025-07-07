import React from 'react'

type Props = {
  className?: string
  strokeWidth?: number
  size?: number
}

const Frame = ({ className = '', strokeWidth = 1, size = 16 }: Props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth={strokeWidth}>
      <path d="M2 11.3333L3.33333 12.6667L6 10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 4.66683L3.33333 6.00016L6 3.3335" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.66602 4H13.9993" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.66602 8H13.9993" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.66602 12H13.9993" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default Frame
