import React from 'react'

interface LinkedinProps {
  className?: string
  strokeWidth?: number
  size?: number
}

const Linkedin: React.FC<LinkedinProps> = ({ className = '', strokeWidth = 1, size = 16 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      stroke="currentColor"
      width={size}
      height={size}
      viewBox="0 0 30 31"
      className={className}
      strokeWidth={strokeWidth || undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 10.5C21.9891 10.5 23.8968 11.2902 25.3033 12.6967C26.7098 14.1032 27.5 16.0109 27.5 18V26.75H22.5V18C22.5 17.337 22.2366 16.7011 21.7678 16.2322C21.2989 15.7634 20.663 15.5 20 15.5C19.337 15.5 18.7011 15.7634 18.2322 16.2322C17.7634 16.7011 17.5 17.337 17.5 18V26.75H12.5V18C12.5 16.0109 13.2902 14.1032 14.6967 12.6967C16.1032 11.2902 18.0109 10.5 20 10.5Z" />
      <path d="M7.5 11.75H2.5V26.75H7.5V11.75Z" />
      <path d="M5 8C6.38071 8 7.5 6.88071 7.5 5.5C7.5 4.11929 6.38071 3 5 3C3.61929 3 2.5 4.11929 2.5 5.5C2.5 6.88071 3.61929 8 5 8Z" />
    </svg>
  )
}

export default Linkedin
