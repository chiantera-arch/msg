'use client'
import { useRef, useState } from 'react'

interface Props {
  onRecorded: (blob: Blob, mimeType: string) => Promise<void>
  disabled?: boolean
}

export function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [state, setState] = useState<'idle' | 'recording' | 'sending'>('idle')
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const cancelledRef = useRef(false)

  const start = async () => {
    if (disabled || state !== 'idle') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      cancelledRef.current = false

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (cancelledRef.current) { setState('idle'); setSeconds(0); return }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        setState('sending')
        await onRecorded(blob, recorder.mimeType)
        setState('idle')
        setSeconds(0)
      }

      recorder.start()
      recorderRef.current = recorder
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setState('idle')
    }
  }

  const stop = () => {
    clearInterval(timerRef.current)
    recorderRef.current?.stop()
  }

  const cancel = () => {
    cancelledRef.current = true
    clearInterval(timerRef.current)
    recorderRef.current?.stop()
    setState('idle')
    setSeconds(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        title="Invia vocale"
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem', opacity: disabled ? 0.35 : 0.65 }}
      >
        🎤
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
      <button type="button" onClick={cancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}>✕</button>
      <span style={{ fontSize: '0.85rem', color: '#ef4444', fontVariantNumeric: 'tabular-nums', flex: 1 }}>
        {state === 'recording' ? `⏺ ${fmt(seconds)}` : '…'}
      </span>
      {state === 'recording' && (
        <button
          type="button"
          onClick={stop}
          style={{ background: '#ef4444', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.85rem', fontWeight: 600 }}
        >
          Invia
        </button>
      )}
    </div>
  )
}
