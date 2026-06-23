'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PhotoUploader } from './PhotoUploader'
import { VoiceRecorder } from './VoiceRecorder'

export function MessageInput({ userId }: { userId: string }) {
  const [text, setText] = useState('')
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [silent, setSilent] = useState(false)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  const sendMessage = async (extra: { voice_url?: string } = {}) => {
    setSending(true)
    const { data: msg } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        content: text.trim() || null,
        photo_url: photoPath,
        silent,
        ...extra,
      })
      .select()
      .single()

    if (msg && !silent) {
      await supabase.functions.invoke('send-push', {
        body: { message_id: msg.id, sender_id: userId },
      })
    }

    setText('')
    setPhotoPath(null)
    setSending(false)
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !photoPath) return
    await sendMessage()
  }

  const handleVoice = async (blob: Blob, mimeType: string) => {
    const ext = mimeType.split(';')[0].split('/')[1] ?? 'webm'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('voices').upload(path, blob, { contentType: mimeType })
    if (!error) await sendMessage({ voice_url: path })
  }

  return (
    <form onSubmit={send} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.75rem 1rem', borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
    }}>
      {!sending && (
        <>
          <PhotoUploader onUploaded={setPhotoPath} disabled={sending} capture icon="📸" label="Scatta foto" />
          <PhotoUploader onUploaded={setPhotoPath} disabled={sending} icon="🖼️" label="Galleria" />
          <VoiceRecorder onRecorded={handleVoice} disabled={sending} />
        </>
      )}

      <button
        type="button"
        onClick={() => setSilent(s => !s)}
        title={silent ? 'Messaggio silenzioso (attivo)' : 'Invia senza notifica'}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0.5rem', opacity: silent ? 1 : 0.35, flexShrink: 0 }}
      >
        🔕
      </button>

      <div style={{ flex: 1, position: 'relative' }}>
        {photoPath && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            📷 {photoPath.split('/').pop()}
            <button type="button" onClick={() => setPhotoPath(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 4 }}>✕</button>
          </div>
        )}
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={photoPath ? 'Aggiungi un testo...' : 'Scrivi un messaggio...'}
          autoFocus
          style={{
            width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '0.5rem 1rem', color: 'var(--text)',
            fontSize: '0.9375rem', outline: 'none',
          }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e) } }}
        />
      </div>

      <button
        type="submit"
        disabled={sending || (!text.trim() && !photoPath)}
        style={{
          background: 'var(--bubble-out)', border: 'none', borderRadius: '50%',
          width: 36, height: 36, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
          opacity: sending || (!text.trim() && !photoPath) ? 0.4 : 1,
        }}
      >
        ↑
      </button>
    </form>
  )
}
