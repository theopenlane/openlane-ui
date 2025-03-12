'use client'

import data, { Emoji } from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import React, { useEffect, useState } from 'react'

interface EmojiPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: Emoji) => void
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onClose, onSelect }) => {
  const [isEmojiOpen, setIsEmojiOpen] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setIsEmojiOpen(true)
    }
  }, [isOpen])

  const handleEmojiSelect = (data: any) => {
    onSelect(data)
    onClose()
    setIsEmojiOpen(false)
  }

  const handleOutsideClick = () => {
    onClose()
    setIsEmojiOpen(false)
  }

  return <div className="relative">{isEmojiOpen && <Picker navPosition="top" onEmojiSelect={(emoji: any) => handleEmojiSelect(emoji)} onClickOutside={handleOutsideClick} />}</div>
}

export default EmojiPicker
