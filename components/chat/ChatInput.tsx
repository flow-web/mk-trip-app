'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import { SendHorizonal } from 'lucide-react'
import { mutations } from '@/lib/db/mutations'

interface ChatInputProps {
  tripId: string
  userId: string
}

export function ChatInput({ tripId, userId }: ChatInputProps) {
  const [text, setText] = useState('')

  const send = useCallback(async () => {
    const body = text.trim()
    if (!body) return
    setText('')
    await mutations.message.create({
      trip_id: tripId,
      user_id: userId,
      body,
    })
  }, [text, tripId, userId])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="border-t border-hairline dark:border-hairline-dark px-4 py-3 flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        rows={1}
        className="flex-1 resize-none bg-sand/30 dark:bg-sand-dark/30 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-mute dark:placeholder:text-ink-mute-dark max-h-32 overflow-y-auto"
      />
      <button
        onClick={send}
        disabled={!text.trim()}
        className="p-2.5 rounded-full bg-ink dark:bg-ink-dark text-paper dark:text-paper-dark disabled:opacity-30 transition-opacity"
      >
        <SendHorizonal className="w-4 h-4" />
      </button>
    </div>
  )
}
