'use client'

import React, { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover'

interface AvatarListData {
  id: string
  imageUrl?: string
  fallback?: string
  firstName?: string
  lastName?: string
}

interface AvatarListProps {
  data: AvatarListData[]
  max?: number
}

const AvatarList = ({ data, max = 10 }: AvatarListProps) => {
  const visibleAvatars = data.slice(0, max)
  const hiddenAvatars = data.slice(max)
  const hiddenCount = hiddenAvatars.length
  const [isOpen, setIsOpen] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 100)
  }

  return (
    <div className="relative flex">
      {visibleAvatars.map(({ id, imageUrl, fallback, firstName, lastName }, index) => (
        <Avatar key={id} className={`w-[30px] h-[30px] border border-white bg-white ${index !== 0 ? '-ml-2' : ''}`}>
          {imageUrl ? <AvatarImage src={imageUrl} alt={`${firstName} ${lastName}`} /> : <AvatarFallback>{fallback}</AvatarFallback>}
        </Avatar>
      ))}

      {hiddenCount > 0 && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className=" z-10 w-[30px] h-[30px] border -ml-2 rounded-full flex items-center justify-center text-xs bg-white cursor-pointer">
              <span>+{hiddenCount}</span>
            </div>
          </PopoverTrigger>

          <PopoverContent onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="max-h-80 overflow-y-auto w-60  bg-background-secondary shadow-md rounded-md border">
            {visibleAvatars.map(({ id, firstName, lastName, fallback }, index) => (
              <div key={id} className={`flex items-center gap-2 p-2 ${index !== visibleAvatars.length - 1 ? 'border-b' : ''}`}>
                <Avatar className="w-5 h-5">
                  <AvatarFallback>{fallback}</AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {firstName} {lastName}
                </span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default AvatarList
