import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/auth';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '900', fontSize: 17, fontStyle: 'italic', letterSpacing: -0.5 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="project/[id]"
          options={{ title: '', headerBackTitle: '뒤로' }}
        />
        <Stack.Screen
          name="review/[projectId]"
          options={{ title: '평가하기', headerBackTitle: '뒤로', gestureEnabled: false }}
        />
        <Stack.Screen
          name="report/[id]"
          options={{ title: '평가 리포트', headerBackTitle: '뒤로' }}
        />
      </Stack>
    </AuthProvider>
  );
}
