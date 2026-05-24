'use client'

import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { MessageBubble } from './MessageBubble'

interface MessageListProps {
  tripId: string
  currentUserId: string
}

export function MessageList({ tripId, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = useLiveQuery(
    () => db.messages.where('trip_id').equals(tripId).sortBy('created_at'),
    [tripId],
  ) ?? []

  const profiles = useLiveQuery(() => db.profiles.toArray(), []) ?? []
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-mute dark:text-ink-mute-dark">
        <p className="text-sm">Aucun message. Lancez la conversation !</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          body={msg.body}
          authorName={profileMap.get(msg.user_id) ?? 'Inconnu'}
          timestamp={msg.created_at}
          isMine={msg.user_id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
