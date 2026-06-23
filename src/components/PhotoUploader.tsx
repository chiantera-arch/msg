'use client'
import { useRef } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  onUploaded: (path: string) => void
  disabled?: boolean
  capture?: boolean   // true = apri la fotocamera, false = galleria/file
  icon?: string
  label?: string
}

export function PhotoUploader({ onUploaded, disabled, capture, icon = '📷', label = 'Allega foto' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file)
    if (!error) onUploaded(path)
    e.target.value = ''
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={label}
        title={label}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.25rem', padding: '0.5rem', color: 'var(--text-muted)',
        }}
      >
        {icon}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        {...(capture ? { capture: 'environment' as const } : {})}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </>
  )
}
