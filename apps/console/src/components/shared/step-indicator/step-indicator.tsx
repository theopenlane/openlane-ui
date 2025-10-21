import React from 'react'

interface StepIndicatorProps {
  active?: boolean
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ active = false }) => {
  return (
    <div className="w-5 h-5 flex items-center justify-center">
      <div className={active ? 'flex justify-center items-center w-5 h-5 rounded-full border border-btn-secondary bg-step-active-bg' : 'w-2.5 h-2.5 rounded-full bg-indicator'}>
        {active && <div className="w-2.5 h-2.5 rounded-full bg-btn-secondary" />}
      </div>
    </div>
  )
}

export default StepIndicator
