import React from 'react'
import Sidebar from '@/components/Sidebar'

const index = () => {
  return (
    <Sidebar>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Sleep</h1>
          <p className="text-muted-foreground">
            Monitor your sleep patterns and quality.
          </p>
        </div>
        <div className="text-center py-12 border border-border rounded-lg bg-card">
          <p className="text-muted-foreground">Sleep tracking features coming soon...</p>
        </div>
      </div>
    </Sidebar>
  )
}

export default index
