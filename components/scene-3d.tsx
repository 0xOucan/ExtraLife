"use client"

import { useState, useEffect } from "react"
import { Shield } from "lucide-react"

// Fallback component that doesn't use Three.js
export default function Scene3D() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Only render on client-side to avoid SSR issues
  if (!isClient) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-purple-800 to-slate-800 flex items-center justify-center">
        <div className="animate-pulse">
          <Shield className="h-20 w-20 text-cyan-400 mx-auto mb-4" />
          <div className="text-cyan-400 text-xl">Loading...</div>
        </div>
      </div>
    )
  }

  // Simple animated background as fallback
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          {/* Animated circles */}
          <div className="absolute h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl animate-pulse" 
               style={{top: '10%', left: '20%', animationDuration: '8s'}}></div>
          <div className="absolute h-96 w-96 rounded-full bg-purple-500/20 blur-3xl animate-pulse" 
               style={{top: '40%', right: '10%', animationDuration: '10s'}}></div>
          <div className="absolute h-64 w-64 rounded-full bg-blue-500/20 blur-3xl animate-pulse" 
               style={{bottom: '15%', left: '30%', animationDuration: '12s'}}></div>
          
          {/* Shield icon */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Shield className="h-40 w-40 text-cyan-400/60 animate-float" />
          </div>
        </div>
      </div>
    </div>
  )
} 