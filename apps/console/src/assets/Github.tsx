import React from 'react'

interface GithubProps {
  className?: string
  strokeWidth?: number
  size?: number
}

const Github: React.FC<GithubProps> = ({ className = '', strokeWidth = 1, size = 16 }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" width={size} height={size} strokeWidth={strokeWidth} className={className}>
      <path
        d="M12.4993 18.3332V14.9998C12.6153 13.9559 12.316 12.9083 11.666 12.0832C14.166 12.0832 16.666 10.4165 16.666 7.49984C16.7327 6.45817 16.441 5.43317 15.8327 4.58317C16.066 3.62484 16.066 2.62484 15.8327 1.6665C15.8327 1.6665 14.9993 1.6665 13.3327 2.9165C11.1327 2.49984 8.86602 2.49984 6.66602 2.9165C4.99935 1.6665 4.16602 1.6665 4.16602 1.6665C3.91602 2.62484 3.91602 3.62484 4.16602 4.58317C3.55924 5.42974 3.26474 6.46049 3.33268 7.49984C3.33268 10.4165 5.83268 12.0832 8.33268 12.0832C8.00768 12.4915 7.76602 12.9582 7.62435 13.4582C7.48268 13.9582 7.44102 14.4832 7.49935 14.9998M7.49935 14.9998V18.3332M7.49935 14.9998C3.74102 16.6665 3.33268 13.3332 1.66602 13.3332"
        stroke="#9AA5B0"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Github
