'use client'

interface MessageBubbleProps {
  body: string
  authorName: string
  timestamp: string
  isMine: boolean
}

export function MessageBubble({ body, authorName, timestamp, isMine }: MessageBubbleProps) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
          isMine
            ? 'bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark rounded-br-sm'
            : 'bg-sand/50 dark:bg-sand-dark/50 rounded-bl-sm'
        }`}
      >
        {!isMine && (
          <p className="text-xs font-semibold text-ink-mute dark:text-ink-mute-dark mb-0.5">
            {authorName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{body}</p>
        <p
          className={`text-[10px] mt-1 ${
            isMine ? 'text-paper/60 dark:text-paper-dark/60' : 'text-ink-mute dark:text-ink-mute-dark'
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  )
}
