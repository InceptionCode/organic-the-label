import { useEffect, useRef } from 'react'

export type LiveWaveformProps = {
  /** Returns the analyser for the playing preview, or null while idle. Read every frame. */
  getAnalyser?: () => AnalyserNode | null
  className?: string
}

const POINTS = 240
// Brand line colors: bone main line, red and sand echoes.
const BONE = '247, 243, 235'
const RED = '179, 25, 25'
const SAND = '217, 199, 167'

/** Fades the line out toward both edges so it reads as a signal passing through, not a box. */
function taper(t: number) {
  const s = Math.sin(Math.PI * t)
  return s * s
}

/** Idle oscilloscope: a few slow, detuned harmonics. Returns -1..1. */
function idleSample(t: number, time: number, phase: number) {
  return (
    0.55 * Math.sin(t * 9.0 + time * 0.9 + phase) +
    0.25 * Math.sin(t * 23.0 - time * 1.4 + phase * 1.7) +
    0.12 * Math.sin(t * 47.0 + time * 2.3 + phase * 0.6) +
    0.08 * Math.sin(t * 3.0 + time * 0.35)
  )
}

/**
 * Hero oscilloscope (Canvas 2D). Idle: slow multi-harmonic drift. While a preview plays, the line
 * follows the analyser's time-domain data, eased in and out so play/pause never snaps.
 * The rAF loop runs only while the canvas is on screen and the tab is visible.
 */
export default function LiveWaveform({ getAnalyser, className = '' }: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const getAnalyserRef = useRef(getAnalyser)

  useEffect(() => {
    getAnalyserRef.current = getAnalyser
  }, [getAnalyser])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let frame = 0
    let onScreen = false
    let live = 0 // 0 idle .. 1 analyser-driven
    let buffer: Uint8Array<ArrayBuffer> | null = null
    const smoothed = new Float32Array(POINTS)
    const start = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const stroke = (values: Float32Array, color: string, alpha: number, lineWidth: number, gain: number, shift: number) => {
      const mid = height / 2
      const amp = height * 0.42 * gain
      ctx.beginPath()
      for (let i = 0; i < POINTS; i++) {
        const t = i / (POINTS - 1)
        const x = t * width
        const y = mid + shift + values[i] * amp * taper(t)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = `rgba(${color}, ${alpha})`
      ctx.lineWidth = lineWidth
      ctx.stroke()
    }

    const echo = new Float32Array(POINTS)
    const draw = () => {
      const time = (performance.now() - start) / 1000
      const analyser = getAnalyserRef.current?.() ?? null
      live += ((analyser ? 1 : 0) - live) * 0.06

      if (analyser) {
        if (!buffer || buffer.length !== analyser.fftSize) buffer = new Uint8Array(analyser.fftSize)
        analyser.getByteTimeDomainData(buffer)
      }

      for (let i = 0; i < POINTS; i++) {
        const t = i / (POINTS - 1)
        // Idle sits about halfway to the playing level so the line reads as alive before any click.
        const idle = idleSample(t, time * 1.3, 0) * 0.8
        let target = idle
        if (buffer && live > 0.001) {
          const sample = (buffer[Math.floor(t * (buffer.length - 1))] - 128) / 128
          target = idle * (1 - live) + Math.max(-1, Math.min(1, sample * 2.2)) * live
        }
        smoothed[i] += (target - smoothed[i]) * 0.35
        echo[i] = idleSample(t, time * 1.05, 1.9) * 0.4 * (1 - live * 0.5) + smoothed[i] * 0.4
      }

      ctx.clearRect(0, 0, width, height)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      stroke(echo, SAND, 0.28, 1, 1, 6)
      stroke(smoothed, RED, 0.7 + live * 0.15, 2.5, 1.06, 2)
      stroke(smoothed, BONE, 0.9, 1.5, 1, 0)

      frame = requestAnimationFrame(draw)
    }

    const run = () => {
      cancelAnimationFrame(frame)
      if (onScreen && document.visibilityState === 'visible') frame = requestAnimationFrame(draw)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting)
      run()
    })
    io.observe(canvas)
    document.addEventListener('visibilitychange', run)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', run)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%' }} />
}
