import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'

const dummyData = [
  { id: 1, src: 'https://via.placeholder.com/40', fallback: 'S' },
  { id: 2, src: '', fallback: 'A' },
  { id: 3, src: '', fallback: 'A' },
  { id: 4, src: '', fallback: 'R' },
  { id: 5, src: '', fallback: 'R' },
  { id: 6, src: '', fallback: 'R' },
  { id: 7, src: '', fallback: 'A' },
]

const AvatarList = () => {
  return (
    <div className="flex">
      {dummyData.map(({ id, src, fallback }, index) => (
        <Avatar key={id} className={`w-10 h-10 border border-white ${index !== 0 ? '-ml-2' : ''}`}>
          {src ? <AvatarImage src={src} alt={`Avatar ${id}`} /> : <AvatarFallback>{fallback}</AvatarFallback>}
        </Avatar>
      ))}
    </div>
  )
}

export default AvatarList
