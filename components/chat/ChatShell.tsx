'use client'

import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

interface ChatShellProps {
  tripId: string
  currentUserId: string
}

export function ChatShell({ tripId, currentUserId }: ChatShellProps) {
  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] md:h-dvh">
      <div className="px-4 py-3 border-b border-hairline dark:border-hairline-dark">
        <h1 className="mk-display text-lg">Chat</h1>
      </div>
      <MessageList tripId={tripId} currentUserId={currentUserId} />
      <ChatInput tripId={tripId} userId={currentUserId} />
    </div>
  )
}
