"use client";

import React, { useState } from 'react';
import { Rocket, FlaskConical, HelpCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

export interface FeedbackPollRef {
  submit: () => Promise<boolean>;
  isValid: () => boolean;
}

interface FeedbackPollProps {
  projectId: string;
  initialCounts?: {
    launch: number;
    research: number;
    more: number;
  };
  userVote?: 'launch' | 'research' | 'more' | null;
  isDemo?: boolean; // [New] Demo Mode
  guestId?: string; // [New] 게스트 식별자
  onChange?: (vote: string | null) => void; // [New] 부모에게 투표값 전달
}

export const FeedbackPoll = React.forwardRef<FeedbackPollRef, FeedbackPollProps>(
  ({ projectId, initialCounts, userVote, isDemo = false, guestId, onChange }, ref) => {
  const [selected, setSelected] = useState<string | null>(userVote || null);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts || { launch: 0, research: 0, more: 0 });
  const [projectData, setProjectData] = useState<any>(null);

  // Fetch Poll Data on Mount
  React.useEffect(() => {
    if (!projectId || isDemo) return;
    const fetchPoll = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
            
            // Guest ID Support
            let url = `/api/projects/${projectId}/vote`;
            if (guestId) url += `?guest_id=${guestId}`;

            const res = await fetch(url, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.counts) setCounts(data.counts);
                if (data.myVote !== undefined) setSelected(data.myVote);
                if (data.project) setProjectData(data.project);
            }
        } catch (e) {
            console.error("Failed to load poll", e);
        }
    };
    fetchPoll();
  }, [projectId, isDemo, guestId]);

  // 부모에게 변경 알림
  React.useEffect(() => {
    if (onChange) onChange(selected);
  }, [selected, onChange]);

  const handleVoteLocal = (type: string) => {
    if (selected === type) {
      setSelected(null);
    } else {
      setSelected(type);
    }
  };

  const hasSelected = () => {
    return selected !== null;
  };

  // [Modified] API Call Removed. Only Validation.
  const handleVoteSubmit = async (): Promise<boolean> => {
    if (!hasSelected()) {
        toast.error("투표 항목을 선택해 주세요.", {
            description: "가장 적절한 피드백 스티커를 하나 선택해야 합니다."
        });
        return false;
    }
    // Parent handles submission
    return true;
  };

  React.useImperativeHandle(ref, () => ({
    submit: handleVoteSubmit,
    isValid: hasSelected
  }));

  // Dynamic Options Base
  const DEFAULT_OPTIONS = [
    { id: 'launch', icon: CheckCircle2, label: "출시 강추!", color: "text-green-500", bgFrom: "from-green-500/10", bgTo: "to-green-600/20", border: "border-green-200", activeBorder: "border-green-500", desc: "당장 계약하시죠!\n탐나는 결과물", image_url: '/review/a1.jpeg' },
    { id: 'more', icon: Clock, label: "보류합니다", color: "text-amber-500", bgFrom: "from-amber-500/10", bgTo: "to-amber-600/20", border: "border-amber-200", activeBorder: "border-amber-500", desc: "좋긴 한데...\n한 끗이 아쉽네요", image_url: '/review/a2.jpeg' },
    { id: 'research', icon: XCircle, label: "다시 기획", color: "text-red-500", bgFrom: "from-red-500/10", bgTo: "to-red-600/20", border: "border-red-200", activeBorder: "border-red-500", desc: "기획부터 다시!\n싹 갈아엎읍시다", image_url: '/review/a3.jpeg' }
  ];

  const options = React.useMemo(() => {
    const customPoll = projectData?.custom_data?.audit_config?.poll || projectData?.custom_data?.poll_config;
    const customOptions = customPoll?.options || projectData?.custom_data?.poll_options;
    
    if (customOptions && Array.isArray(customOptions)) {
      return customOptions.map((opt: any, idx: number) => ({
        id: opt.id || `opt_${idx}`,
        icon: opt.icon === 'flask' ? FlaskConical : opt.icon === 'help' ? HelpCircle : opt.id === 'launch' ? CheckCircle2 : CheckCircle2,
        image_url: opt.image_url,
        label: opt.label,
        desc: opt.desc,
        color: opt.color || (idx === 0 ? "text-green-500" : idx === 1 ? "text-amber-500" : "text-blue-500"),
        bgFrom: opt.bgFrom || (idx === 0 ? "from-green-500/10" : idx === 1 ? "from-amber-500/10" : "from-blue-500/10"),
        bgTo: opt.bgTo || (idx === 0 ? "to-green-600/20" : idx === 1 ? "to-amber-600/20" : "to-blue-600/20"),
        border: opt.border || (idx === 0 ? "border-green-200" : idx === 1 ? "border-amber-200" : "border-blue-200"),
        activeBorder: opt.activeBorder || (idx === 0 ? "border-green-500" : idx === 1 ? "border-amber-500" : "border-blue-500"),
        count: counts[opt.id] || 0
      }));
    }
    return DEFAULT_OPTIONS.map(opt => ({ ...opt, count: counts[opt.id as keyof typeof counts] || 0 }));
  }, [projectData, counts]);

  return (
    <div className="w-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Rocket className="w-32 h-32 text-gray-900" />
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            
            return (
              <button
                key={opt.id}
                onClick={() => handleVoteLocal(opt.id)}
                className={cn(
                  "relative group flex flex-row items-center p-2 rounded-xl border-2 transition-all duration-200 w-full shadow-sm bg-white",
                  isSelected 
                    ? cn(opt.activeBorder, "bg-slate-50/50") 
                    : cn("border-slate-100 hover:border-slate-200")
                )}
              >
                {/* Left: Image (Small) */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 relative rounded-[1.5rem] overflow-hidden bg-slate-100 transition-all outline outline-1 outline-black/5">
                   {opt.image_url ? (
                     <Image src={opt.image_url} alt={opt.label} fill className="object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <Icon className={cn("w-10 h-10 opacity-50", opt.color)} />
                     </div>
                   )}
                </div>

                {/* Right: Content */}
                <div className="flex-1 px-5 flex flex-col items-start justify-center gap-1.5 text-left min-w-0 py-2">
                   <h3 className={cn("text-base sm:text-lg font-black leading-tight tracking-tight", isSelected ? "text-slate-900" : "text-slate-700")}>{opt.label}</h3>
                   <p className="text-xs sm:text-sm font-bold text-slate-400 leading-tight whitespace-pre-wrap break-keep">{opt.desc}</p>
                </div>
                
                {/* Selection Indicator on the far right */}
                <div className="pr-6">
                   <div className={cn(
                     "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                     isSelected ? cn(opt.activeBorder, opt.color, "bg-white shadow-md") : "border-slate-100 bg-slate-50 opacity-30"
                   )}>
                      {isSelected && <CheckCircle2 className="w-5 h-5" />}
                   </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

FeedbackPoll.displayName = 'FeedbackPoll';
