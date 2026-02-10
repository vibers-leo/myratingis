import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase/client";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

/**
 * 프로젝트 좋아요 관련 기능을 제공하는 커스텀 훅 (Firebase Version)
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
        const likeRef = doc(db, "projects", projectId, "likes", userId);
        const likeSnap = await getDoc(likeRef);
        return likeSnap.exists();
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
      
      const likeRef = doc(db, "projects", projectId, "likes", userId);
      const projectRef = doc(db, "projects", projectId);

      if (currentIsLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(projectRef, { 
            likes: increment(-1),
            // like_count field for compatibility if needed
            like_count: increment(-1) 
        });
      } else {
        // Like
        await setDoc(likeRef, {
            user_id: userId,
            created_at: serverTimestamp()
        });
        await updateDoc(projectRef, { 
            likes: increment(1),
            like_count: increment(1) 
        });

        // (Optional) 여기에 알림 로직 추가 가능 notification logic here
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
