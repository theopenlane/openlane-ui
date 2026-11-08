import { useEffect, useState } from 'react'

const countFittingRows = (container: HTMLElement): number => {
  const rows = container.children
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]
    if (row instanceof HTMLElement && row.offsetTop + row.offsetHeight > container.clientHeight) {
      return index
    }
  }
  return rows.length
}

export const useFittingRowCount = (items: readonly unknown[]) => {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [fittingCount, setFittingCount] = useState(items.length)

  useEffect(() => {
    if (!container) {
      return
    }

    const update = () => setFittingCount(countFittingRows(container))
    update()

    const observer = new ResizeObserver(update)
    observer.observe(container)
    Array.from(container.children).forEach((row) => observer.observe(row))
    return () => observer.disconnect()
  }, [container, items])

  return { containerRef: setContainer, fittingCount }
}
