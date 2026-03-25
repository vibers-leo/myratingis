"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Coins, Loader2, Coffee, Gift, ShoppingCart, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'coffee', label: '커피' },
  { id: 'convenience', label: '편의점' },
  { id: 'chicken', label: '치킨' },
  { id: 'department', label: '백화점' },
  { id: 'etc', label: '기타' },
];

const CATEGORY_ICONS: Record<string, any> = {
  coffee: Coffee,
  convenience: ShoppingBag,
  chicken: Gift,
  department: Gift,
  etc: Gift,
  point: Coins,
};

export default function ShopPage() {
  const router = useRouter();
  const { user, userProfile, isAuthenticated, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPoints, setCurrentPoints] = useState(0);

  // 구매 모달
  const [purchaseModal, setPurchaseModal] = useState<{ open: boolean; item: any }>({ open: false, item: null });
  const [purchasing, setPurchasing] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({ name: '', phone: '', address: '', memo: '' });

  useEffect(() => {
    fetchCatalog();
  }, [activeCategory]);

  useEffect(() => {
    if (userProfile) {
      setCurrentPoints(userProfile.points || 0);
    }
  }, [userProfile]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = activeCategory !== 'all' ? `?category=${activeCategory}` : '';
      const res = await fetch(`/api/rewards/catalog${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (e) {
      console.error('[Shop] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !purchaseModal.item) return;
    setPurchasing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/rewards/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          reward_item_id: purchaseModal.item.id,
          delivery_info: deliveryInfo.name ? deliveryInfo : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("구매 완료! 🎉", {
          description: `${data.item_name}을(를) 구매했습니다. 남은 포인트: ${data.remaining_points}P`,
        });
        setCurrentPoints(data.remaining_points);
        setPurchaseModal({ open: false, item: null });
        setDeliveryInfo({ name: '', phone: '', address: '', memo: '' });
      } else {
        toast.error("구매 실패", { description: data.error });
      }
    } catch (e: any) {
      toast.error("오류가 발생했습니다.", { description: e.message });
    } finally {
      setPurchasing(false);
    }
  };

  const canAfford = (item: any) => currentPoints >= item.point_cost;

  return (
    <div className="min-h-screen bg-chef-bg pb-20">
      <MyRatingIsHeader />

      <main className="max-w-5xl mx-auto px-2 md:px-10 pt-28">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-chef-text italic tracking-tighter uppercase">Point Shop</h1>
            <p className="text-sm text-chef-text/40 font-medium mt-2">포인트로 다양한 보상을 받아보세요</p>
          </div>

          {isAuthenticated && (
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 rounded-xl text-white flex items-center gap-3">
              <Coins className="w-5 h-5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">보유 포인트</p>
                <p className="text-2xl font-black italic tracking-tight">{currentPoints.toLocaleString()}P</p>
              </div>
            </div>
          )}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-orange-500 text-white"
                  : "bg-chef-card border border-chef-border text-chef-text/50 hover:text-chef-text/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 상품 그리드 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-chef-text/30">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">상품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const Icon = CATEGORY_ICONS[item.category] || Gift;
              const affordable = canAfford(item);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-chef-card border border-chef-border rounded-xl p-5 transition-all hover:shadow-xl group",
                    !affordable && "opacity-50"
                  )}
                >
                  {/* 아이콘/이미지 */}
                  <div className="w-full aspect-square bg-chef-panel rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500/5 transition-colors">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <Icon className="w-12 h-12 text-chef-text/20" />
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <h3 className="text-sm font-black text-chef-text truncate mb-1">{item.name}</h3>
                  <p className="text-[10px] text-chef-text/30 font-medium mb-3 line-clamp-1">
                    {item.description || CATEGORIES.find(c => c.id === item.category)?.label}
                  </p>

                  {/* 가격 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-lg font-black text-orange-500">{item.point_cost.toLocaleString()}</span>
                      <span className="text-[10px] font-bold text-orange-500/60">P</span>
                    </div>
                    {item.stock !== -1 && (
                      <span className="text-[11px] font-bold text-chef-text/30">
                        {item.stock > 0 ? `${item.stock}개 남음` : '품절'}
                      </span>
                    )}
                  </div>

                  {/* 구매 버튼 */}
                  <Button
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push('/login?returnTo=/shop');
                        return;
                      }
                      setPurchaseModal({ open: true, item });
                    }}
                    disabled={!affordable || (item.stock !== -1 && item.stock <= 0)}
                    className="w-full mt-3 h-10 bg-chef-text text-chef-bg hover:bg-chef-text/90 font-black text-xs rounded-lg"
                  >
                    {!isAuthenticated ? '로그인 필요' : !affordable ? '포인트 부족' : '구매하기'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* 비로그인 안내 */}
        {!authLoading && !isAuthenticated && (
          <div className="mt-12 p-8 bg-orange-500/5 border border-orange-500/20 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-chef-text mb-4">로그인하면 포인트로 상품을 구매할 수 있습니다</p>
            <Button
              onClick={() => router.push('/login?returnTo=/shop')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black"
            >
              로그인하기
            </Button>
          </div>
        )}
      </main>

      {/* 구매 확인 모달 */}
      <Dialog open={purchaseModal.open} onOpenChange={(open) => !purchasing && setPurchaseModal({ open, item: open ? purchaseModal.item : null })}>
        <DialogContent className="bg-chef-card border-chef-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-chef-text">구매 확인</DialogTitle>
            <DialogDescription className="text-chef-text/50">
              {purchaseModal.item?.name}을(를) 구매하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 가격 정보 */}
            <div className="bg-chef-panel rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-chef-text/50">상품</span>
                <span className="font-bold text-chef-text">{purchaseModal.item?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-chef-text/50">가격</span>
                <span className="font-black text-orange-500">{purchaseModal.item?.point_cost?.toLocaleString()}P</span>
              </div>
              <div className="border-t border-chef-border pt-2 flex justify-between text-sm">
                <span className="text-chef-text/50">보유 포인트</span>
                <span className="font-bold text-chef-text">{currentPoints.toLocaleString()}P</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-chef-text/50">구매 후 잔액</span>
                <span className="font-black text-chef-text">
                  {(currentPoints - (purchaseModal.item?.point_cost || 0)).toLocaleString()}P
                </span>
              </div>
            </div>

            {/* 배송 정보 (실물 상품) */}
            {purchaseModal.item?.category !== 'point' && (
              <div className="space-y-3">
                <p className="text-xs font-black text-chef-text/40 uppercase tracking-widest">배송 정보 (선택)</p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-chef-text/40">이름</Label>
                    <Input
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                      placeholder="수령인 이름"
                      className="bg-chef-panel border-chef-border text-chef-text"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-chef-text/40">연락처</Label>
                    <Input
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                      placeholder="010-0000-0000"
                      className="bg-chef-panel border-chef-border text-chef-text"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-chef-text/40">주소</Label>
                    <Input
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                      placeholder="배송 주소"
                      className="bg-chef-panel border-chef-border text-chef-text"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-chef-text/40">메모</Label>
                    <Input
                      value={deliveryInfo.memo}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, memo: e.target.value })}
                      placeholder="요청 사항"
                      className="bg-chef-panel border-chef-border text-chef-text"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPurchaseModal({ open: false, item: null })}
              disabled={purchasing}
              className="border-chef-border text-chef-text"
            >
              취소
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={purchasing}
              className="bg-orange-500 hover:bg-orange-600 text-white font-black"
            >
              {purchasing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              {purchasing ? '구매 중...' : '구매하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
