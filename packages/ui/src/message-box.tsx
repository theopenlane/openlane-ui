import React from 'react'
import { clsx } from 'clsx'

export const MessageBox: React.FC<any> = ({ message, className }) => {
  return (
    <div
      className={clsx(
        'my-2.5 p-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative',
        className,
      )}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
    </div>
  )
}

export default MessageBox
