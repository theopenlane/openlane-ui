import React from 'react'

type CalendarArrowProps = {
  className?: string
  strokeWidth?: number
}

const CalendarArrow = ({ className = '', strokeWidth = 1 }: CalendarArrowProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor">
      <path
        d="M14 18L18 14M18 14L22 18M18 14V22M16 2V6M21 11.343V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H14M3 10H21M8 2V6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

export default CalendarArrow
