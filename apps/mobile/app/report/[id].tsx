import { useLocalSearchParams } from 'expo-router';
import { ReportScreen } from '@/screens';

export default function ReportRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReportScreen id={id!} />;
}
