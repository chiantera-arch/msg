'use client'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { Message } from '@/lib/types'

interface Props {
  message: Message
  isOwn: boolean
  onDelete: (id: string) => void
}

export function MessageBubble({ message, isOwn, onDelete }: Props) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const [showDelete, setShowDelete] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!showDelete) return
    const dismiss = () => setShowDelete(false)
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [showDelete])

  const startPress = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isOwn || message.deleted_at) return
    e.stopPropagation()
    timerRef.current = setTimeout(() => setShowDelete(true), 500)
  }

  const cancelPress = () => clearTimeout(timerRef.current)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOwn && !message.deleted_at) setShowDelete(true)
  }

  if (message.deleted_at) {
    return (
      <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '0.25rem' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0.5rem' }}>
          messaggio eliminato
        </p>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '0.25rem', position: 'relative' }}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={() => { cancelPress() }}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onContextMenu={handleContextMenu}
    >
      {showDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { onDelete(message.id); setShowDelete(false) }}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            ...(isOwn ? { right: 0 } : { left: 0 }),
            background: '#ef4444',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            zIndex: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          Elimina
        </button>
      )}

      <div style={{
        maxWidth: '75%',
        background: isOwn ? 'var(--bubble-out)' : 'var(--bubble-in)',
        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: message.photo_url ? 0 : '0.5rem 0.75rem',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}>
        {message.silent && (
          <span style={{ position: 'absolute', top: 4, right: 6, fontSize: '0.6rem', opacity: 0.6 }}>🔕</span>
        )}
        {message.photo_url && (
          <Image
            src={`${supabaseUrl}/storage/v1/object/public/photos/${message.photo_url}`}
            alt="foto"
            width={280}
            height={280}
            style={{ objectFit: 'cover', display: 'block', borderRadius: message.content ? '18px 18px 0 0' : undefined }}
          />
        )}
        {message.content && (
          <p style={{
            fontSize: '0.9375rem', lineHeight: 1.4,
            padding: message.photo_url ? '0.4rem 0.75rem 0.5rem' : undefined,
            wordBreak: 'break-word',
          }}>
            {message.content}
          </p>
        )}
        <span style={{
          display: 'block', textAlign: 'right', fontSize: '0.65rem', opacity: 0.55,
          padding: message.photo_url ? '0 0.5rem 0.25rem' : '0.1rem 0 0',
        }}>
          {new Date(message.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          {isOwn && message.read_at && ' ✓'}
        </span>
      </div>
    </div>
  )
}
