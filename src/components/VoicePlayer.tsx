'use client'
import { useRef, useState } from 'react'

interface Props {
  src: string
}

export function VoicePlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    playing ? a.pause() : a.play()
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.75rem', minWidth: 200 }}>
      <audio
        ref={audioRef}
        src={src}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a || !a.duration) return
          setCurrent(a.currentTime)
          setProgress(a.currentTime / a.duration)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrent(0) }}
      />
      <button
        onClick={toggle}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'inherit', padding: 0, lineHeight: 1, flexShrink: 0 }}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div
        onClick={seek}
        style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
      >
        <div style={{ height: '100%', width: `${progress * 100}%`, background: 'currentColor', opacity: 0.75, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '0.7rem', opacity: 0.65, flexShrink: 0, minWidth: 30, textAlign: 'right' }}>
        {current > 0 ? fmt(current) : fmt(duration)}
      </span>
    </div>
  )
}
