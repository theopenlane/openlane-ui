import React from 'react'

interface Props {
  className?: string
  strokeWidth?: number
  size?: number
  height?: number
  width?: number
}

const Drag = ({ className, strokeWidth, height = 16, width = 5 }: Props) => {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 5 18" fill="none" strokeWidth={strokeWidth} stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_11057_31126)">
        <path d="M-1 4H1.8V6.5H-1V4Z" fill="currentColor" />
        <path d="M-1 7.75H1.8V10.25H-1V7.75Z" fill="currentColor" />
        <path d="M-1 11.5H1.8V14H-1V11.5Z" fill="currentColor" />
        <path d="M3.2 4H6V6.5H3.2V4Z" fill="currentColor" />
        <path d="M3.2 7.75H6V10.25H3.2V7.75Z" fill="currentColor" />
        <path d="M3.2 11.5H6V14H3.2V11.5Z" fill="currentColor" />
      </g>
      <defs>
        <clipPath id="clip0_11057_31126">
          <rect width="5" height="18" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}

export default Drag
