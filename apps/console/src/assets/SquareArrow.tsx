import React from 'react'

const SquareArrow = ({ className = '', strokeWidth = 1, size = 16 }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} stroke="currentColor" strokeWidth={2}>
      <path
        d="M4.33333 7H9.66667M9.66667 7L7 9.66667M9.66667 7L7 4.33333M2.33333 1H11.6667C12.403 1 13 1.59695 13 2.33333V11.6667C13 12.403 12.403 13 11.6667 13H2.33333C1.59695 13 1 12.403 1 11.6667V2.33333C1 1.59695 1.59695 1 2.33333 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

export default SquareArrow
