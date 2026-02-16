"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Coins, ArrowUpCircle, ArrowDownCircle, Gift, ShoppingBag, Clock, CheckCircle2, Truck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface RewardTabProps {
  userId: string;
  currentPoints: number;
}

export function RewardTab({ userId, currentPoints }: RewardTabProps) {
  const router = useRouter();
  const [pointLogs, setPointLogs] = useState<any[]>([]);
  const [rewardClaims, setRewardClaims] = useState<any[]>([]);
  const [shopOrders, setShopOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'history' | 'rewards' | 'orders'>('history');

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [logsResult, claimsResult, ordersResult] = await Promise.all([
        (supabase as any)
          .from('point_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        (supabase as any)
          .from('reward_claims')
          .select('*, project_rewards(project_id, reward_type, distribution_method)')
          .eq('user_id', userId)
          .order('claimed_at', { ascending: false }),
        (supabase as any)
          .from('shop_orders')
          .select('*, reward_items(name, image_url, category)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      setPointLogs(logsResult.data || []);
      setRewardClaims(claimsResult.data || []);
      setShopOrders(ordersResult.data || []);
    } catch (e) {
      console.error('[RewardTab] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, { label: string; icon: any; color: string }> = {
      pending: { label: '대기중', icon: Clock, color: 'text-blue-500 bg-blue-500/10' },
      claimed: { label: '수령완료', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
      delivered: { label: '배송완료', icon: Truck, color: 'text-emerald-500 bg-emerald-500/10' },
      cancelled: { label: '취소됨', icon: Clock, color: 'text-gray-400 bg-gray-500/10' },
      refunded: { label: '환불됨', icon: ArrowDownCircle, color: 'text-red-400 bg-red-500/10' },
      ordered: { label: '주문완료', icon: ShoppingBag, color: 'text-orange-500 bg-orange-500/10' },
      processing: { label: '처리중', icon: Loader2, color: 'text-yellow-500 bg-yellow-500/10' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 포인트 잔액 카드 */}
      <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Coins size={100} />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-2">보유 포인트</p>
          <p className="text-5xl font-black italic tracking-tighter">
            {currentPoints.toLocaleString()}
            <span className="text-2xl ml-2 opacity-80">P</span>
          </p>
          <Button
            onClick={() => router.push('/shop')}
            variant="outline"
            className="mt-6 h-10 bg-white/10 border-white/20 text-white hover:bg-white/20 font-black text-xs uppercase tracking-widest rounded-lg"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            포인트샵 가기
          </Button>
        </div>
      </div>

      {/* 섹션 탭 */}
      <div className="flex border-b border-chef-border gap-1">
        {[
          { id: 'history' as const, label: '포인트 내역', count: pointLogs.length },
          { id: 'rewards' as const, label: '받은 보상', count: rewardClaims.length },
          { id: 'orders' as const, label: '구매 내역', count: shopOrders.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
              activeSection === tab.id
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-chef-text/40 hover:text-chef-text/60'
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-50">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* 포인트 내역 */}
      {activeSection === 'history' && (
        <div className="space-y-2">
          {pointLogs.length === 0 ? (
            <div className="text-center py-12 text-chef-text/30">
              <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">포인트 내역이 없습니다</p>
            </div>
          ) : (
            pointLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-chef-card border border-chef-border rounded-lg">
                <div className="flex items-center gap-3">
                  {log.amount > 0 ? (
                    <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-chef-text">{log.reason}</p>
                    <p className="text-[10px] font-bold text-chef-text/40">
                      {new Date(log.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-lg font-black ${log.amount > 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {log.amount > 0 ? '+' : ''}{log.amount.toLocaleString()}P
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 받은 보상 */}
      {activeSection === 'rewards' && (
        <div className="space-y-2">
          {rewardClaims.length === 0 ? (
            <div className="text-center py-12 text-chef-text/30">
              <Gift className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">받은 보상이 없습니다</p>
              <p className="text-xs mt-1 opacity-60">프로젝트를 평가하고 보상을 받아보세요!</p>
            </div>
          ) : (
            rewardClaims.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between p-4 bg-chef-card border border-chef-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Gift className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-chef-text">
                      {claim.reward_type === 'point' ? `${claim.amount}P 보상` : '쿠폰 보상'}
                    </p>
                    <p className="text-[10px] font-bold text-chef-text/40">
                      {new Date(claim.claimed_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                {statusBadge(claim.status)}
              </div>
            ))
          )}
        </div>
      )}

      {/* 구매 내역 */}
      {activeSection === 'orders' && (
        <div className="space-y-2">
          {shopOrders.length === 0 ? (
            <div className="text-center py-12 text-chef-text/30">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold">구매 내역이 없습니다</p>
              <Button
                onClick={() => router.push('/shop')}
                variant="outline"
                className="mt-3 text-xs font-bold"
              >
                포인트샵 구경하기
              </Button>
            </div>
          ) : (
            shopOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-chef-card border border-chef-border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-chef-panel rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-chef-text/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-chef-text">
                      {order.reward_items?.name || '상품'}
                    </p>
                    <p className="text-[10px] font-bold text-chef-text/40">
                      {order.points_spent.toLocaleString()}P 사용 · {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                {statusBadge(order.status)}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
