import { useRouter } from 'expo-router';
import { HomeScreen } from '@/screens';

export default function HomeRoute() {
  const router = useRouter();
  return <HomeScreen onNavigate={(path) => router.push(path as any)} />;
}
