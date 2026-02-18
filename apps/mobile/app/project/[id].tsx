import { useLocalSearchParams, useRouter } from 'expo-router';
import { ProjectDetailScreen } from '@/screens';

export default function ProjectDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return <ProjectDetailScreen id={id!} onNavigate={(path) => router.push(path as any)} />;
}
