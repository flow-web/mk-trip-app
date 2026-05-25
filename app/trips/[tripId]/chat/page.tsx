import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatShell } from '@/components/chat/ChatShell'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/welcome')

  return <ChatShell tripId={tripId} currentUserId={user.id} />
}
