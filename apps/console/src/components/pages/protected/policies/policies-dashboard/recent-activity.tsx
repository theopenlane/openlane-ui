'use client'

import React from 'react'

export default function RecentActivity() {
  const activities = [
    { text: 'Password Expiration Policy updated', time: '2 hours ago' },
    { text: 'User Access was modified', time: 'Jan 7, 2024' },
    { text: 'System Backup was edited by Sarah Hedrik', time: 'Jan 8, 2024' },
  ]

  return (
    <div className="rounded-2xl flex-1">
      <h2 className="text-lg mb-7">Recent Activity</h2>
      <ul className="space-y-4">
        {activities.map(({ text, time }) => (
          <li key={text} className="flex justify-between items-center border-b pb-2 last:border-b-0">
            <span className="text-sm">{text}</span>
            <span className="text-sm text-text-informational">{time}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
