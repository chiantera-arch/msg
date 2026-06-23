'use client'
import { useMessages } from '@/hooks/useMessages'
import { MessageBubble } from '@/components/MessageBubble'
import { MessageInput } from '@/components/MessageInput'

export function ChatView({ userId }: { userId: string }) {
  const { messages, loading, bottomRef, deleteMessage } = useMessages()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>...</p>}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === userId} onDelete={deleteMessage} />
        ))}
        <div ref={bottomRef} />
      </main>

      <MessageInput userId={userId} />
    </div>
  )
}
