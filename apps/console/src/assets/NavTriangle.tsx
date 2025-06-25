import React from 'react'

interface Props {
  className?: string
  strokeWidth?: number
  size?: number
}

const NavTriangle = ({ className, size, strokeWidth }: Props) => {
  return (
    <svg className={className} fill="currentColor" stroke="currentColor" width={size} height={size} strokeWidth={strokeWidth} viewBox="0 0 18 28" xmlns="http://www.w3.org/2000/svg">
      <line x1="1.25683" y1="0.456409" x2="17.223" y2="27.0286" />
    </svg>
  )
}

export default NavTriangle
