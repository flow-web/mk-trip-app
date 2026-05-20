import { useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { signInWithEmail } from '../../store/auth$'

export default function Welcome() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async () => {
    if (!email.includes('@')) {
      Alert.alert('Email invalide')
      return
    }
    setLoading(true)
    const { error } = await signInWithEmail(email.trim())
    setLoading(false)
    if (error) {
      Alert.alert('Erreur', error.message)
      return
    }
    router.push({ pathname: '/(auth)/check-email', params: { email } })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: '#F2F2F7', fontSize: 32, fontWeight: '700', letterSpacing: -1 }}>
          MK Trip
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 15, marginTop: 8, marginBottom: 32 }}>
          Tes voyages, en mieux organisés.
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="ton@email.com"
          placeholderTextColor="#48484A"
          style={{
            backgroundColor: '#1C1C1E',
            color: '#F2F2F7',
            borderRadius: 14,
            paddingHorizontal: 16,
            paddingVertical: 14,
            fontSize: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        />
        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: '#FF6B4A',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Recevoir le lien</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
