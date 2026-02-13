import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

/**
 * 프로젝트 좋아요 관련 기능을 제공하는 커스텀 훅 (Supabase Version)
 */
export function useLikes(projectId?: string, initialLikes: number = 0) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || null;

  // 1. 좋아요 여부 조회
  const { data: isLiked = false } = useQuery({
    queryKey: ["like", projectId, userId],
    queryFn: async () => {
      if (!projectId || !userId) return false;
      try {
        const { data, error } = await supabase
          .from('project_likes')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching like status:", error);
          return false;
        }

        return !!data;
      } catch (e) {
        console.error("Error fetching like status:", e);
        return false;
      }
    },
    enabled: !!projectId && !!userId,
  });

  // 2. 좋아요 토글 Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ currentIsLiked }: { currentIsLiked: boolean }) => {
      if (!projectId || !userId) throw new Error("로그인이 필요하거나 잘못된 프로젝트입니다.");

      if (currentIsLiked) {
        // Unlike: 좋아요 삭제
        const { error: deleteError } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // projects 테이블의 likes 카운트 감소
        const { data: projectData } = await supabase
          .from('projects')
          .select('likes')
          .eq('id', projectId)
          .single();

        const currentLikes = projectData?.likes || 0;
        await supabase
          .from('projects')
          .update({ likes: Math.max(0, currentLikes - 1) })
          .eq('id', projectId);

      } else {
        // Like: 좋아요 추가
        const { error: insertError } = await supabase
          .from('project_likes')
          .insert({
            project_id: projectId,
            user_id: userId,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;

        // projects 테이블의 likes 카운트 증가
        const { data: projectData } = await supabase
          .from('projects')
          .select('likes')
          .eq('id', projectId)
          .single();

        const currentLikes = projectData?.likes || 0;
        await supabase
          .from('projects')
          .update({ likes: currentLikes + 1 })
          .eq('id', projectId);
      }
    },
    onMutate: async ({ currentIsLiked }) => {
      // Optimistic Update
      const queryKey = ["like", projectId, userId];
      await queryClient.cancelQueries({ queryKey });
      const previousLiked = queryClient.getQueryData<boolean>(queryKey);

      queryClient.setQueryData(queryKey, !currentIsLiked);

      return { previousLiked };
    },
    onError: (err, newTodo, context) => {
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
