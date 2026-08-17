import React from 'react'
import '@/styles/questionnaire/questionnaire-background.css'

interface QuestionnaireBackgroundProps {
  theme?: 'auto' | 'light' | 'dark'
  minHeight?: string
  className?: string
  children: React.ReactNode
}

export const QuestionnaireBackground = ({ theme = 'auto', minHeight = '100vh', className = '', children }: QuestionnaireBackgroundProps) => (
  <div className={`ol-qbg ol-qbg--${theme} ${className}`} style={{ minHeight }}>
    <span className="ol-qbg__grid" aria-hidden="true" />
    <span className="ol-qbg__glow" aria-hidden="true" />
    <span className="ol-qbg__fade" aria-hidden="true" />
    <div className="ol-qbg__content">{children}</div>
  </div>
)
