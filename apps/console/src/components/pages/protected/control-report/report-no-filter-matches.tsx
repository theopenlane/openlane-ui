'use client'

import React from 'react'

const ReportNoFilterMatches: React.FC = () => (
  <div className="mt-4 rounded-md border border-border/30 bg-muted/20 px-5 py-2.5 text-base text-muted-foreground shadow-sm">
    <p>No controls match your current filters.</p>
    <p>Try adjusting or clearing your filters to see more controls.</p>
  </div>
)

export default ReportNoFilterMatches
