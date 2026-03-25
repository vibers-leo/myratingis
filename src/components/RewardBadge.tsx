"use client";

import { Gift, Users } from "lucide-react";

interface RewardBadgeProps {
  rewardConfig: {
    type: string;
    amount: number;
    count: number;
    method: string;
  };
  ratingCount?: number;
}

export function RewardBadge({ rewardConfig, ratingCount = 0 }: RewardBadgeProps) {
  if (!rewardConfig || rewardConfig.type === 'none') return null;

  const methodLabel: Record<string, string> = {
    fcfs: '선착순',
    lottery: '추첨',
    author: '작가선정',
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md">
      <Gift className="w-3 h-3 text-orange-500" />
      <span className="text-[10px] font-black text-orange-500 tracking-wide">
        {(rewardConfig.amount || 0).toLocaleString()}P
      </span>
      <span className="text-[11px] font-bold text-chef-text/30 uppercase">
        {methodLabel[rewardConfig.method] || '선착순'}
      </span>
      <span className="text-[11px] font-bold text-chef-text/20 flex items-center gap-0.5">
        <Users className="w-2.5 h-2.5" />
        {rewardConfig.count || 0}명
      </span>
    </div>
  );
}
