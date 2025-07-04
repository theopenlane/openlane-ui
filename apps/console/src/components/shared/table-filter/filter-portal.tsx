import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const FilterPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const portalRoot = document.getElementById('datatable-filter-portal')
  return portalRoot ? createPortal(children, portalRoot) : null
}

export default FilterPortal
