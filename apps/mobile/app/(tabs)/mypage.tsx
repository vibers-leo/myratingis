import { useRouter } from 'expo-router';
import { MyPageScreen } from '@/screens';

export default function MyPageRoute() {
  const router = useRouter();
  return <MyPageScreen onNavigate={(path) => router.push(path as any)} />;
}
