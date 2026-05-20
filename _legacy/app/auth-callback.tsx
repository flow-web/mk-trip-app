import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string; token_hash?: string; type?: string }>()

  useEffect(() => {
    ;(async () => {
      // Cas 1 : Supabase renvoie déjà access_token + refresh_token dans le fragment
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        })
        router.replace('/')
        return
      }
      // Cas 2 : token_hash style (PKCE) — verifyOtp
      if (params.token_hash && params.type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: params.type as any,
        })
        if (!error) {
          router.replace('/')
          return
        }
      }
      router.replace('/(auth)/welcome')
    })()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#0F0F11', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#FF6B4A" />
    </View>
  )
}
