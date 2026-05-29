'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Terminal, Activity, Cpu, Layers, Github, Twitter, ChevronUp, ChevronDown, Radio } from 'lucide-react'
import Link from 'next/link'

const Footer = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [fps, setFps] = useState(60.0)
  const [uptime, setUptime] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Track performance graph history
  const fpsHistoryRef = useRef<number[]>(Array.from({ length: 40 }).map(() => 60.0))

  // Real-time ticking indicators for sci-fi telemetry
  useEffect(() => {
    const fpsInterval = setInterval(() => {
      // Simulate typical minor FPS fluctuations (59.5 - 60.4)
      const currentFps = parseFloat((59.5 + Math.random() * 0.9).toFixed(1))
      setFps(currentFps)
    }, 700)

    const uptimeInterval = setInterval(() => {
      setUptime((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(fpsInterval)
      clearInterval(uptimeInterval)
    }
  }, [])

  // Draw real-time performance oscilloscope waveform on the canvas
  useEffect(() => {
    if (!isDrawerOpen) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    
    // Fit canvas width/height to its bounding container
    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth
        canvas.height = 54
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const draw = () => {
      if (!ctx || !canvas) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw cybernetic graph grid lines
      ctx.strokeStyle = 'rgba(200, 184, 154, 0.08)'
      ctx.lineWidth = 0.5
      
      // Horizontal grid divisions
      for (let y = 8; y < canvas.height; y += 12) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      
      // Vertical grid divisions
      for (let x = 12; x < canvas.width; x += 22) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      // Add current FPS to the rolling history buffer
      const history = fpsHistoryRef.current
      history.push(fps)
      if (history.length > 50) history.shift()

      // Draw the neon oscilloscope line
      ctx.strokeStyle = '#c8b89a' // Theme Accent Bronze/Gold
      ctx.lineWidth = 1.2
      ctx.shadowBlur = 5
      ctx.shadowColor = 'rgba(200, 184, 154, 0.4)'
      ctx.beginPath()

      const step = canvas.width / (history.length - 1)
      history.forEach((val, i) => {
        // Map FPS range (58.5 - 61.5) to canvas pixel height
        const minVal = 58.5
        const maxVal = 61.5
        const pct = (val - minVal) / (maxVal - minVal)
        const mappedY = canvas.height - 6 - pct * (canvas.height - 12)
        const x = i * step
        
        if (i === 0) {
          ctx.moveTo(x, mappedY)
        } else {
          ctx.lineTo(x, mappedY)
        }
      })
      ctx.stroke()

      // Fill area under graph line with semi-transparent accent glow gradient
      ctx.shadowBlur = 0
      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.closePath()
      
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
      grad.addColorStop(0, 'rgba(200, 184, 154, 0.08)')
      grad.addColorStop(1, 'rgba(200, 184, 154, 0.0)')
      ctx.fillStyle = grad
      ctx.fill()

      animationId = requestAnimationFrame(draw)
    }

    draw()
    
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [isDrawerOpen, fps])

  // Format uptime into MM:SS
  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <footer className="fixed bottom-0 left-0 w-full z-[9999] pointer-events-none select-none font-mono">
      {/* ================= DIAGNOSTICS SLIDE-UP DRAWER ================= */}
      <div 
        className={`w-full bg-[#0c0b0a]/95 border-t border-[#3a3836]/60 backdrop-blur-xl transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) pointer-events-auto overflow-hidden ${
          isDrawerOpen ? 'max-h-72 opacity-100 py-6' : 'max-h-0 opacity-0 py-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-[10px] tracking-[1.5px] uppercase text-[#d4cfc8]/80">
          {/* Engine Parameters */}
          <div className="bg-[#141211]/80 border border-[#3a3836]/40 p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#c8b89a]/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-125" />
            <div className="flex items-center gap-2 text-[#c8b89a] font-bold">
              <Cpu size={12} className="animate-pulse" />
              <span>CORE_ENGINE</span>
            </div>
            <div className="h-[1px] bg-[#3a3836]/40 my-1" />
            <div className="flex justify-between">
              <span className="text-[#8a847a]">VFX_SHADERS:</span>
              <span className="text-[#d4cfc8]">CUSTOM_GLSL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a847a]">RENDER_SYS:</span>
              <span className="text-[#d4cfc8]">THREE.JS / R3F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a847a]">VERTEX_BUFFER:</span>
              <span className="text-[#d4cfc8] animate-pulse">134,842 VTX</span>
            </div>
          </div>

          {/* Telemetry Stats */}
          <div className="bg-[#141211]/80 border border-[#3a3836]/40 p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#c8b89a]/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-125" />
            <div className="flex items-center gap-2 text-[#c8b89a] font-bold">
              <Activity size={12} />
              <span>TELEMETRY</span>
            </div>
            <div className="h-[1px] bg-[#3a3836]/40 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-[#8a847a]">SIMULATION_FPS:</span>
              <span className="text-emerald-400 font-bold tabular-nums">{fps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a847a]">UPTIME_CLOCK:</span>
              <span className="text-[#d4cfc8] font-bold tabular-nums">{formatUptime(uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8a847a]">MEMORY_LOAD:</span>
              <span className="text-[#d4cfc8]">32.8 MB</span>
            </div>
          </div>

          {/* Graphics Controls (Oscilloscope Chart) */}
          <div className="bg-[#141211]/80 border border-[#3a3836]/40 p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-[#c8b89a] font-bold">
              <Layers size={12} />
              <span>SYS_OSCILLOSCOPE</span>
            </div>
            <div className="h-[1px] bg-[#3a3836]/40 my-1" />
            <div className="w-full flex-grow relative h-[54px] flex items-center justify-center">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-[#141211]/80 border border-[#3a3836]/40 p-4 rounded flex flex-col gap-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#c8b89a]/5 rounded-bl-full pointer-events-none transition-all duration-300 group-hover:scale-125" />
            <div className="flex items-center gap-2 text-[#c8b89a] font-bold">
              <Terminal size={12} />
              <span>DIAG_CONSOLE</span>
            </div>
            <div className="h-[1px] bg-[#3a3836]/40 my-1" />
            <div className="text-[#8a847a] text-[8px] leading-relaxed overflow-y-auto max-h-16 pr-1 font-mono">
              <div className="text-emerald-400">&gt; SHIELD_VFX: ONLINE</div>
              <div>&gt; CACHE: COMPLETED</div>
              <div className="text-amber-400">&gt; LEVA: CONSOLE INJECT</div>
              <div className="animate-pulse">&gt; SYS_STATS: LISTENING...</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PRIMARY FOOTER CONTROL BAR ================= */}
      <div className="w-full bg-[#0a0a0a]/80 border-t border-[#3a3836]/60 backdrop-blur-md px-8 py-3 flex justify-between items-center pointer-events-auto">
        {/* Left Side: System & Trademark */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#d4cfc8]/50 text-[9px] tracking-[2px] uppercase">
            {/* Pulsing visual heartbeat dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden xs:inline">SYS_STATUS // ACTIVE</span>
          </div>
          <div className="hidden md:block w-[1px] h-3 bg-[#3a3836]/60" />
          <span className="text-[#d4cfc8]/30 text-[8px] tracking-[2px] uppercase">
            &copy; AEGIS HUD
          </span>
        </div>

        {/* Center Side: Active Mode / Telemetry Trigger */}
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#1a1816] hover:bg-[#242220] text-[#c8b89a] hover:text-[#f0ece6] border border-[#3a3836] hover:border-[#c8b89a] rounded transition-all duration-300 shadow-[0_0_10px_rgba(200,184,154,0.02)] hover:shadow-[0_0_15px_rgba(200,184,154,0.08)] text-[9px] tracking-[2px] uppercase cursor-pointer"
        >
          <Radio size={11} className={`${isDrawerOpen ? 'animate-pulse text-emerald-400' : ''}`} />
          <span>DIAGNOSTICS PANEL</span>
          {isDrawerOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>

        {/* Right Side: Social Connections */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-[#d4cfc8]/30 text-[8px] tracking-[2.5px] uppercase">
            V0.1.6
          </span>
          <div className="hidden sm:block w-[1px] h-3 bg-[#3a3836]/60" />
          <div className="flex items-center gap-3">
            {/* GitHub */}
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4cfc8]/50 hover:text-[#f0ece6] hover:shadow-[0_0_8px_rgba(240,236,230,0.3)] transition-all duration-300 p-1.5 bg-[#141211] border border-[#3a3836] rounded cursor-pointer"
              aria-label="GitHub Repository"
            >
              <Github size={13} />
            </Link>
            
            {/* Twitter */}
            <Link
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4cfc8]/50 hover:text-[#f0ece6] hover:shadow-[0_0_8px_rgba(240,236,230,0.3)] transition-all duration-300 p-1.5 bg-[#141211] border border-[#3a3836] rounded cursor-pointer"
              aria-label="Twitter Account"
            >
              <Twitter size={13} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer