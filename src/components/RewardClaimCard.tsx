"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Gift, CheckCircle2, Clock, Users, Loader2, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface RewardClaimCardProps {
  projectId: string;
  rewardConfig: {
    type: string;
    amount: number;
    count: number;
    method: string;
  };
  userId: string | null;
  onLoginClick?: () => void;
}

export function RewardClaimCard({ projectId, rewardConfig, userId, onLoginClick }: RewardClaimCardProps) {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const [myClaimStatus, setMyClaimStatus] = useState<string | null>(null);
  const [claimList, setClaimList] = useState<any[]>([]);

  useEffect(() => {
    fetchRewardStatus();
  }, [projectId]);

  const fetchRewardStatus = async () => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/rewards/${projectId}`, { headers });
      const data = await res.json();

      if (data.success && data.reward) {
        setRewardData(data.reward);
        setMyClaimStatus(data.myClaimStatus);
        setClaimList(data.claims || []);
      }
    } catch (e) {
      console.error('[RewardClaimCard] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!userId) {
      onLoginClick?.();
      return;
    }

    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.status === 'pending') {
          toast.success("응모가 완료되었습니다!", {
            description: "추첨 결과를 기다려주세요.",
          });
          setMyClaimStatus('pending');
        } else {
          toast.success("보상이 지급되었습니다! 🎉", {
            description: `${data.amount}P가 지급되었습니다.`,
          });
          setMyClaimStatus('claimed');
        }
        fetchRewardStatus();
      } else {
        toast.error("보상 수령 실패", { description: data.error });
      }
    } catch (e: any) {
      toast.error("오류가 발생했습니다.", { description: e.message });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-xs mx-auto my-6 p-6 bg-chef-panel border border-chef-border rounded-xl">
        <div className="flex items-center justify-center gap-2 text-chef-text/40">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-bold">보상 정보 로딩중...</span>
        </div>
      </div>
    );
  }

  // 보상이 없거나 type이 none이면 표시 안함
  if (!rewardData && (!rewardConfig || rewardConfig.type === 'none')) {
    return null;
  }

  const reward = rewardData || {
    amount_per_person: rewardConfig.amount,
    total_slots: rewardConfig.count,
    claimed_count: 0,
    distribution_method: rewardConfig.method,
    reward_type: rewardConfig.type,
    status: 'active',
  };

  const slotsRemaining = reward.total_slots - reward.claimed_count;
  const progressPercent = reward.total_slots > 0
    ? Math.min(100, (reward.claimed_count / reward.total_slots) * 100)
    : 0;

  const methodLabel: Record<string, string> = {
    fcfs: '선착순',
    lottery: '추첨',
    author: '작가 선정',
  };

  return (
    <div className="w-full max-w-xs mx-auto my-8">
      <div className="relative bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-2 border-orange-500/20 rounded-xl p-6 overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Gift size={80} />
        </div>

        {/* 헤더 */}
        <div className="relative z-10 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black text-chef-text">평가 참여 보상</h4>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
              {methodLabel[reward.distribution_method] || '선착순'}
            </span>
          </div>
        </div>

        {/* 보상 금액 */}
        <div className="relative z-10 mb-4">
          <div className="text-3xl font-black text-chef-text italic tracking-tight">
            {reward.amount_per_person.toLocaleString()}
            <span className="text-lg ml-1 text-orange-500">P</span>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black text-chef-text/40 uppercase tracking-widest flex items-center gap-1">
              <Users className="w-3 h-3" />
              {reward.claimed_count}/{reward.total_slots}명 수령
            </span>
            <span className="text-[10px] font-black text-chef-text/40">
              {slotsRemaining > 0 ? `${slotsRemaining}자리 남음` : '마감'}
            </span>
          </div>
          <div className="w-full h-2 bg-chef-panel rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 수령자 목록 */}
        {claimList.length > 0 && (
          <div className="relative z-10 mb-4 flex flex-wrap gap-1">
            {claimList.slice(0, 5).map((c) => (
              <span key={c.id} className="px-2 py-0.5 bg-chef-panel rounded text-[11px] font-bold text-chef-text/50">
                {c.maskedName} {c.status === 'claimed' ? '✓' : '⏳'}
              </span>
            ))}
            {claimList.length > 5 && (
              <span className="px-2 py-0.5 text-[11px] font-bold text-chef-text/30">
                +{claimList.length - 5}명
              </span>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="relative z-10">
          {!userId ? (
            <Button
              onClick={onLoginClick}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-lg shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              로그인하고 보상받기
            </Button>
          ) : myClaimStatus === 'claimed' || myClaimStatus === 'delivered' ? (
            <div className="w-full h-12 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-black text-green-500">보상 수령 완료!</span>
            </div>
          ) : myClaimStatus === 'pending' ? (
            <div className="w-full h-12 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-black text-blue-500">
                {reward.distribution_method === 'lottery' ? '추첨 결과 대기중' : '작가 선정 대기중'}
              </span>
            </div>
          ) : reward.status === 'completed' || slotsRemaining <= 0 ? (
            <div className="w-full h-12 bg-chef-panel border border-chef-border rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-chef-text/40">보상이 모두 소진되었습니다</span>
            </div>
          ) : (
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-lg shadow-lg shadow-orange-500/20"
            >
              {claiming ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 처리 중...</>
              ) : reward.distribution_method === 'fcfs' ? (
                <><Gift className="w-4 h-4 mr-2" /> 보상 받기</>
              ) : reward.distribution_method === 'lottery' ? (
                <><Trophy className="w-4 h-4 mr-2" /> 추첨 응모하기</>
              ) : (
                <><Trophy className="w-4 h-4 mr-2" /> 보상 응모하기</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
