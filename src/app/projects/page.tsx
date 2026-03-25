import ProjectsClient from './ProjectsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '평가 참여하기 | 제 평가는요?',
  description: '다양한 프로젝트를 심사하고 나만의 피드백을 남겨보세요.',
};

export default function ProjectsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // We now handle data fetching on the client side (ProjectsClient) using Firebase
  return (
    <ProjectsClient 
      initialProjects={[]} 
      initialTotal={0} 
    />
  );
}
