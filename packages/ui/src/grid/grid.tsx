import React, { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { gridStyles, type GridVariants } from './grid.styles'

interface GridProps extends GridVariants {
  className?: string
  children: ReactNode
}

interface GridRowProps extends Pick<GridVariants, 'columns' | 'gap'> {
  className?: string
  children: ReactNode
}

interface GridCellProps {
  className?: string
  children: ReactNode
}

const Grid: React.FC<GridProps> = ({
  rows,
  columns,
  gap,
  className,
  children,
}) => {
  const styles = gridStyles({ rows, columns, gap })
  return <div className={cn(styles.wrapper(), className)}>{children}</div>
}

const GridRow: React.FC<GridRowProps> = ({
  columns,
  gap,
  className,
  children,
}) => {
  const styles = gridStyles({ columns, gap })
  return <div className={cn(styles.row(), className)}>{children}</div>
}

const GridCell: React.FC<GridCellProps> = ({ className, children }) => {
  const styles = gridStyles()
  return <div className={cn(styles.cell(), className)}>{children}</div>
}

export { Grid, GridRow, GridCell }
