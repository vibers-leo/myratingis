import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

/**
 * 프로젝트 좋아요 훅 (API 기반, Supabase 제거)
 */
export function useLikes(projectId?: string, initialLikes: number = 0) {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const userId = user?.id || null;

  // 좋아요 여부 조회
  const { data: isLiked = false } = useQuery({
    queryKey: ["like", projectId, userId],
    queryFn: async () => {
      if (!projectId || !userId) return false;
      try {
        const res = await fetch(`/api/likes?userId=${userId}&projectId=${projectId}`);
        if (!res.ok) return false;
        const data = await res.json();
        return data.liked;
      } catch {
        return false;
      }
    },
    enabled: !!projectId && !!userId,
  });

  // 좋아요 토글
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ currentIsLiked }: { currentIsLiked: boolean }) => {
      if (!projectId || !userId || !token) throw new Error("로그인이 필요합니다.");

      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      if (!res.ok) throw new Error('좋아요 처리 실패');
      return res.json();
    },
    onMutate: async ({ currentIsLiked }) => {
      const queryKey = ["like", projectId, userId];
      await queryClient.cancelQueries({ queryKey });
      const previousLiked = queryClient.getQueryData<boolean>(queryKey);
      queryClient.setQueryData(queryKey, !currentIsLiked);
      return { previousLiked };
    },
    onError: (err, _vars, context) => {
      queryClient.setQueryData(["like", projectId, userId], context?.previousLiked);
      toast.error("좋아요 처리에 실패했습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["like", projectId, userId] });
    },
  });

  const toggleLike = () => {
    if (!userId) {
      toast.error("로그인이 필요합니다.");
      return;
    }
    toggleLikeMutation.mutate({ currentIsLiked: isLiked });
  };

  return {
    isLiked,
    toggleLike,
    isLoading: toggleLikeMutation.isPending,
  };
}
