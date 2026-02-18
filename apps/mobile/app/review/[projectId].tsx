import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReviewScreen } from '@/screens';

export default function ReviewRoute() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  return (
    <ReviewScreen
      projectId={projectId!}
      onNavigate={(path) => router.push(path as any)}
      onReplace={(path) => router.replace(path as any)}
    />
  );
}
