"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gift, Users, Trophy, Loader2, CheckCircle2, Clock, Truck, XCircle, Shuffle, ChefHat, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { cn } from "@/lib/utils";

export default function AdminRewardsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [rewards, setRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [shopOrders, setShopOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
      return;
    }
    if (isAdmin) fetchRewards();
  }, [isAdmin, authLoading]);

  const fetchRewards = async () => {
    try {
      // project_rewards + projects 조인
      const { data, error } = await (supabase as any)
        .from('project_rewards')
        .select('*, projects(title, author_email)')
        .order('created_at', { ascending: false });

      if (!error) setRewards(data || []);

      // shop_orders 전체 조회
      const { data: orders } = await (supabase as any)
        .from('shop_orders')
        .select('*, reward_items(name), profiles:user_id(username, nickname)')
        .order('created_at', { ascending: false })
        .limit(50);

      setShopOrders(orders || []);
    } catch (e) {
      console.error('[AdminRewards] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async (rewardId: string, projectId: string) => {
    setClaimsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/rewards/${projectId}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
      });
      const result = await res.json();
      if (result.success) {
        setClaims(result.claims || []);
      }

      // 상세 claims (admin은 user_id 포함)
      const { data: detailedClaims } = await (supabase as any)
        .from('reward_claims')
        .select('*, profiles:user_id(username, nickname, email)')
        .eq('project_reward_id', rewardId)
        .order('claimed_at', { ascending: false });

      if (detailedClaims) setClaims(detailedClaims);
    } catch (e) {
      console.error('[AdminRewards] Claims fetch error:', e);
    } finally {
      setClaimsLoading(false);
    }
  };

  const handleLottery = async (projectId: string) => {
    if (!confirm('정말 추첨을 실행하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/rewards/lottery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("추첨 완료!", { description: data.message });
        fetchRewards();
      } else {
        toast.error("추첨 실패", { description: data.error });
      }
    } catch (e: any) {
      toast.error("오류", { description: e.message });
    }
  };

  const handleAward = async (projectId: string, targetUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/rewards/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, user_id: targetUserId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("보상 지급 완료!");
        if (selectedReward) fetchClaims(selectedReward.id, selectedReward.project_id);
      } else {
        toast.error("지급 실패", { description: data.error });
      }
    } catch (e: any) {
      toast.error("오류", { description: e.message });
    }
  };

  const handleDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      await (supabase as any)
        .from('shop_orders')
        .update({
          status: newStatus,
          ...(newStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
        })
        .eq('id', orderId);

      toast.success(`상태가 '${newStatus}'로 변경되었습니다.`);
      fetchRewards();
    } catch (e: any) {
      toast.error("상태 변경 실패", { description: e.message });
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      active: { label: '활성', color: 'text-green-500 bg-green-500/10' },
      completed: { label: '완료', color: 'text-blue-500 bg-blue-500/10' },
      cancelled: { label: '취소', color: 'text-gray-400 bg-gray-500/10' },
      pending_lottery: { label: '추첨대기', color: 'text-yellow-500 bg-yellow-500/10' },
      pending: { label: '대기', color: 'text-blue-400 bg-blue-400/10' },
      claimed: { label: '지급완료', color: 'text-green-500 bg-green-500/10' },
      delivered: { label: '배송완료', color: 'text-emerald-500 bg-emerald-500/10' },
      ordered: { label: '주문완료', color: 'text-orange-500 bg-orange-500/10' },
      processing: { label: '처리중', color: 'text-yellow-500 bg-yellow-500/10' },
    };
    const c = config[status] || { label: status, color: 'text-gray-400 bg-gray-500/10' };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${c.color}`}>
        {c.label}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chef-bg">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-chef-bg pb-20">
      <MyRatingIsHeader />

      <main className="max-w-6xl mx-auto px-4 md:px-10 pt-28">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} className="text-chef-text/40 hover:text-chef-text">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-chef-text italic tracking-tighter uppercase">Reward Dashboard</h1>
            <p className="text-sm text-chef-text/40 font-medium mt-1">보상 관리 대시보드</p>
          </div>
        </div>

        {/* 프로젝트별 보상 현황 */}
        <section className="mb-12">
          <h2 className="text-lg font-black text-chef-text uppercase tracking-widest mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-orange-500" />
            프로젝트 보상 현황
          </h2>

          {rewards.length === 0 ? (
            <div className="text-center py-12 bg-chef-card border border-chef-border rounded-xl">
              <Gift className="w-10 h-10 mx-auto mb-3 text-chef-text/20" />
              <p className="text-sm font-bold text-chef-text/40">설정된 보상이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    "bg-chef-card border border-chef-border rounded-xl p-5 transition-all cursor-pointer hover:border-orange-500/30",
                    selectedReward?.id === r.id && "border-orange-500/50 bg-orange-500/5"
                  )}
                  onClick={() => {
                    setSelectedReward(r);
                    fetchClaims(r.id, r.project_id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-chef-text">{r.projects?.title || '프로젝트'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-chef-text/40">{r.reward_type === 'point' ? '포인트' : '쿠폰'}</span>
                        <span className="text-xs font-bold text-orange-500">{r.amount_per_person}P/인</span>
                        <span className="text-xs text-chef-text/40">
                          {r.distribution_method === 'fcfs' ? '선착순' : r.distribution_method === 'lottery' ? '추첨' : '작가선정'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-black text-chef-text">{r.claimed_count}/{r.total_slots}</p>
                        <p className="text-[10px] text-chef-text/30">수령/전체</p>
                      </div>
                      {statusBadge(r.status)}
                      {r.distribution_method === 'lottery' && r.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleLottery(r.project_id); }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs"
                        >
                          <Shuffle className="w-3 h-3 mr-1" /> 추첨
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 선택된 보상의 수령자 목록 */}
        {selectedReward && (
          <section className="mb-12">
            <h2 className="text-lg font-black text-chef-text uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              수령자 목록 - {selectedReward.projects?.title}
            </h2>

            {claimsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-8 bg-chef-card border border-chef-border rounded-xl">
                <p className="text-sm font-bold text-chef-text/40">수령자가 없습니다</p>
              </div>
            ) : (
              <div className="bg-chef-card border border-chef-border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-chef-border">
                      <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">사용자</th>
                      <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">상태</th>
                      <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">금액</th>
                      <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">일시</th>
                      <th className="text-right p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim: any) => (
                      <tr key={claim.id} className="border-b border-chef-border/50 last:border-0">
                        <td className="p-3">
                          <p className="text-sm font-bold text-chef-text">
                            {claim.profiles?.username || claim.profiles?.nickname || claim.maskedName || 'User'}
                          </p>
                          {claim.profiles?.email && (
                            <p className="text-[10px] text-chef-text/30">{claim.profiles.email}</p>
                          )}
                        </td>
                        <td className="p-3">{statusBadge(claim.status)}</td>
                        <td className="p-3 text-sm font-bold text-chef-text">{claim.amount}P</td>
                        <td className="p-3 text-xs text-chef-text/40">
                          {new Date(claim.claimed_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="p-3 text-right">
                          {selectedReward.distribution_method === 'author' && claim.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleAward(selectedReward.project_id, claim.user_id)}
                              className="bg-green-600 hover:bg-green-700 text-white font-black text-xs"
                            >
                              <Trophy className="w-3 h-3 mr-1" /> 선정
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* 포인트샵 주문 관리 */}
        <section>
          <h2 className="text-lg font-black text-chef-text uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            포인트샵 주문 관리
          </h2>

          {shopOrders.length === 0 ? (
            <div className="text-center py-12 bg-chef-card border border-chef-border rounded-xl">
              <p className="text-sm font-bold text-chef-text/40">주문이 없습니다</p>
            </div>
          ) : (
            <div className="bg-chef-card border border-chef-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-chef-border">
                    <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">주문자</th>
                    <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">상품</th>
                    <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">포인트</th>
                    <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">상태</th>
                    <th className="text-left p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">일시</th>
                    <th className="text-right p-3 text-[10px] font-black text-chef-text/40 uppercase tracking-widest">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {shopOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-chef-border/50 last:border-0">
                      <td className="p-3 text-sm font-bold text-chef-text">
                        {order.profiles?.username || order.profiles?.nickname || 'User'}
                      </td>
                      <td className="p-3 text-sm text-chef-text">{order.reward_items?.name || '상품'}</td>
                      <td className="p-3 text-sm font-bold text-orange-500">{order.points_spent}P</td>
                      <td className="p-3">{statusBadge(order.status)}</td>
                      <td className="p-3 text-xs text-chef-text/40">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {order.status === 'ordered' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeliveryStatus(order.id, 'processing')}
                              className="text-xs font-bold"
                            >
                              처리중
                            </Button>
                          )}
                          {(order.status === 'ordered' || order.status === 'processing') && (
                            <Button
                              size="sm"
                              onClick={() => handleDeliveryStatus(order.id, 'delivered')}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
                            >
                              <Truck className="w-3 h-3 mr-1" /> 배송완료
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
