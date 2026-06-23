'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { subscribeToPush } from '@/lib/push'

export default function JoinForm() {
  const [status, setStatus] = useState('Accesso in corso...')
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const hash = params.get('h')
    if (!hash) { setStatus('Link non valido.'); return }

    const supabase = createClient()
    supabase.auth.verifyOtp({ token_hash: hash, type: 'magiclink' })
      .then(async ({ error }) => {
        if (error) {
          setStatus('Link scaduto o non valido.')
        } else {
          await subscribeToPush().catch(() => {})
          router.replace('/chat')
        }
      })
  }, [params, router])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{status}</p>
    </div>
  )
}
