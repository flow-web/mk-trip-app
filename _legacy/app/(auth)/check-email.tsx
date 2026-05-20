import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Mail } from 'lucide-react-native'

export default function CheckEmail() {
  const { email } = useLocalSearchParams<{ email: string }>()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F11' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        <Mail size={48} color="#FF6B4A" strokeWidth={1.5} />
        <Text style={{ color: '#F2F2F7', fontSize: 22, fontWeight: '700', marginTop: 16 }}>
          Regarde tes mails
        </Text>
        <Text style={{ color: '#8E8E93', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          On a envoyé un lien de connexion à{'\n'}
          <Text style={{ color: '#F2F2F7', fontWeight: '600' }}>{email}</Text>
        </Text>
      </View>
    </SafeAreaView>
  )
}
