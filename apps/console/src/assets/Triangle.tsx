import React from 'react'

interface TriangleProps {
  className?: string
  strokeWidth?: number
  size?: number
}

const Triangle: React.FC<TriangleProps> = ({ className = '', strokeWidth = 1, size = 16 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      width={size}
      height={size}
      viewBox="0 0 1065 927"
      className={className}
      strokeWidth={strokeWidth || 1}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M514.746 10.75C522.513 -2.70305 541.749 -2.91336 549.875 10.1191L550.254 10.75L1060.78 895C1068.67 908.667 1058.8 925.75 1043.02 925.75H21.9785C6.44411 925.75 -3.35688 909.196 3.86719 895.643L4.22461 895L514.746 10.75Z" />
    </svg>
  )
}

export default Triangle
