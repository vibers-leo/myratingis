"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";  // Ensure Textarea is imported
import { Check, Wand2, History, FileText, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeanCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply?: (content: string) => void;
  onSave?: (data: LeanCanvasData) => void;
  initialData?: Partial<LeanCanvasData>;
}

export interface LeanCanvasData {
  problem: string;
  customerSegments: string;
  uniqueValueProposition: string;
  solution: string;
  channels: string;
  revenueStreams: string;
  costStructure: string;
  keyMetrics: string;
  unfairAdvantage: string;
}

const defaultData: LeanCanvasData = {
  problem: "",
  customerSegments: "",
  uniqueValueProposition: "",
  solution: "",
  channels: "",
  revenueStreams: "",
  costStructure: "",
  keyMetrics: "",
  unfairAdvantage: "",
};

interface AIHistoryItem {
    id: string;
    title: string;
    toolType: string;
    createdAt: string;
    resultContent: string | null;
}

export function LeanCanvasModal({ open, onOpenChange, onApply, onSave, initialData }: LeanCanvasModalProps) {
  const [canvasData, setCanvasData] = useState<LeanCanvasData>(defaultData);
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create');
  const [historyList, setHistoryList] = useState<AIHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Sync initialData
  useEffect(() => {
    if (open && initialData) {
       setCanvasData({ ...defaultData, ...initialData });
    }
    // Default to create tab on open
    if (open) {
        // setActiveTab('create'); 
    }
  }, [open, initialData]);

  // Fetch History when tab changes
  useEffect(() => {
      if (activeTab === 'import' && open) {
          fetchHistory();
      }
  }, [activeTab, open]);

  const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
          const res = await fetch('/api/ai/history');
          if (!res.ok) throw new Error('Failed to load history');
          const data = await res.json();
          setHistoryList(data.history || []);
      } catch (e) {
          console.error(e);
          toast.error("기획 내역을 불러오는데 실패했습니다.");
      } finally {
          setIsLoadingHistory(false);
      }
  };

  const parseAndApplyContent = (content: string) => {
      // Simple Markdown Parsing Strategy
      // Assumes format like "### Problem ... ### Solution ..."
      const newData = { ...defaultData };
      
      const sections = [
          { key: 'problem', pattern: /(?:###|##|\*\*)\s*(?:문제|Problem)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'customerSegments', pattern: /(?:###|##|\*\*)\s*(?:고객|Customer)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'solution', pattern: /(?:###|##|\*\*)\s*(?:해결|Solution)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'uniqueValueProposition', pattern: /(?:###|##|\*\*)\s*(?:가치|Value)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'unfairAdvantage', pattern: /(?:###|##|\*\*)\s*(?:경쟁|Advantage)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'channels', pattern: /(?:###|##|\*\*)\s*(?:채널|Channel)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'keyMetrics', pattern: /(?:###|##|\*\*)\s*(?:지표|Metric)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'costStructure', pattern: /(?:###|##|\*\*)\s*(?:비용|Cost)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
          { key: 'revenueStreams', pattern: /(?:###|##|\*\*)\s*(?:수익|Revenue)(?:.*?)[\r\n]+([\s\S]*?)(?=(?:###|##|\*\*)|$)/i },
      ];

      let matchedCount = 0;
      sections.forEach(({ key, pattern }) => {
          const match = content.match(pattern);
          if (match && match[1]) {
              (newData as any)[key] = match[1].trim();
              matchedCount++;
          }
      });

      if (matchedCount === 0) {
          // Fallback: If no structure detected, put everything in Solution or show warning
          newData.solution = content; // 일단 솔루션에 다 넎음
          toast.info("자동 파싱에 실패하여 원본 내용을 불러왔습니다. 적절히 배치해주세요.");
      } else {
          toast.success("AI 기획 내용을 린 캔버스 양식에 맞춰 불러왔습니다!");
      }

      setCanvasData(newData);
      setActiveTab('create'); // Switch back to editor view
  };

  const handleChange = (key: keyof LeanCanvasData, value: string) => {
    setCanvasData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
      if (onSave) {
          onSave(canvasData);
          toast.success("저장되었습니다.");
          onOpenChange(false);
      }
  };

  const handleApplyToProject = () => {
    if (!onApply) return;
    const formattedContent = `
<h2>📊 프로젝트 린 캔버스 (Lean Canvas)</h2>
<div class="lean-canvas-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; border: 1px solid #e5e7eb; padding: 1rem; border-radius: 0.5rem; background: #f9fafb;">
    <div style="grid-column: span 1; border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
        <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #ef4444;">🚨 문제 (Problem)</h3>
        <p>${canvasData.problem.replace(/\n/g, '<br/>')}</p>
    </div>
    <div style="grid-column: span 1; border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
        <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #f59e0b;">💡 솔루션 (Solution)</h3>
        <p>${canvasData.solution.replace(/\n/g, '<br/>')}</p>
    </div>
    <div style="grid-column: span 1; border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
        <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #8b5cf6;">💎 가치 제안 (Value Prop)</h3>
        <p>${canvasData.uniqueValueProposition.replace(/\n/g, '<br/>')}</p>
    </div>
    <div style="grid-column: span 1; border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
        <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #10b981;">🛡 경쟁 우위 (Advantage)</h3>
        <p>${canvasData.unfairAdvantage.replace(/\n/g, '<br/>')}</p>
    </div>
    <div style="grid-column: span 1; border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
        <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #3b82f6;">🎯 고객군 (Segments)</h3>
        <p>${canvasData.customerSegments.replace(/\n/g, '<br/>')}</p>
    </div>
    
    <div style="grid-column: span 5; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div style="border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
             <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #6b7280;">📊 핵심 지표 (Metrics)</h3>
             <p>${canvasData.keyMetrics.replace(/\n/g, '<br/>')}</p>
        </div>
        <div style="border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
             <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #d946ef;">📢 채널 (Channels)</h3>
             <p>${canvasData.channels.replace(/\n/g, '<br/>')}</p>
        </div>
    </div>

    <div style="grid-column: span 5; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div style="border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
             <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #ef4444;">💰 비용 구조 (Cost)</h3>
             <p>${canvasData.costStructure.replace(/\n/g, '<br/>')}</p>
        </div>
        <div style="border: 1px solid #d1d5db; padding: 1rem; background: white; border-radius: 0.375rem;">
             <h3 style="font-weight: bold; margin-bottom: 0.5rem; color: #22c55e;">💸 수익원 (Revenue)</h3>
             <p>${canvasData.revenueStreams.replace(/\n/g, '<br/>')}</p>
        </div>
    </div>
</div>
    `.trim();

    onApply(formattedContent);
    onOpenChange(false);
    toast.success("프로젝트 설명에 적용되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-gray-50">
        <div className="p-6 border-b bg-white flex justify-between items-center">
             <div>
                <DialogTitle className="flex items-center gap-2 text-xl mb-1">
                    <Wand2 className="w-5 h-5 text-purple-600" /> 
                    AI 린 캔버스 생성
                </DialogTitle>
                <p className="text-sm text-gray-500">
                    비즈니스 모델을 한 눈에 파악할 수 있는 린 캔버스를 작성합니다.
                </p>
             </div>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('create')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-md transition-all",
                        activeTab === 'create' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    직접 작성
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                        activeTab === 'import' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-900"
                    )}
                >
                    <History className="w-4 h-4" />
                    내 기획 불러오기
                </button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'import' ? (
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">내 AI 기획 내역 (MyPage Chat)</h3>
                    {isLoadingHistory ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        </div>
                    ) : historyList.length > 0 ? (
                        <div className="grid gap-3">
                            {historyList.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => item.resultContent && parseAndApplyContent(item.resultContent)}
                                    className="bg-white p-5 rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-2 rounded-lg", item.toolType?.includes('lean') ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600')}>
                                                {item.toolType?.includes('lean') ? <FileText className="w-4 h-4"/> : <Wand2 className="w-4 h-4"/>}
                                            </div>
                                            <h4 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {item.title || "제목 없음"}
                                            </h4>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 ml-10">
                                        {item.resultContent?.substring(0, 150) || "결과 내용 없음"}
                                    </p>
                                    <div className="flex justify-end mt-2">
                                        <span className="text-xs font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            불러오기 <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed">
                            <p className="text-gray-500">저장된 기획 내역이 없습니다.</p>
                            <Button variant="link" onClick={() => window.open('/mypage?tab=ai-tools', '_blank')}>마이페이지에서 기획하러 가기</Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-5 gap-4 h-full min-h-[600px]">
                    {/* Row 1: Top Section */}
                    <div className="col-span-1 p-4 bg-white rounded-xl border border-gray-200">
                        <label className="text-xs font-bold text-red-500 uppercase mb-2 block">1. Problem</label>
                        <Textarea 
                            placeholder="고객이 겪는 상위 3가지 문제"
                            className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                            value={canvasData.problem}
                            onChange={(e) => handleChange('problem', e.target.value)}
                        />
                    </div>
                    <div className="col-span-1 p-4 bg-white rounded-xl border border-gray-200">
                        <label className="text-xs font-bold text-orange-500 uppercase mb-2 block">4. Solution</label>
                         <Textarea 
                            placeholder="각 문제에 대한 해결책"
                            className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                            value={canvasData.solution} // Fixed: was problem
                            onChange={(e) => handleChange('solution', e.target.value)}
                        />
                    </div>
                    <div className="col-span-1 p-4 bg-white rounded-xl border border-gray-200">
                        <label className="text-xs font-bold text-purple-500 uppercase mb-2 block">3. UVP</label>
                         <Textarea 
                            placeholder="고유 가치 제안 (차별점)"
                            className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                            value={canvasData.uniqueValueProposition}
                            onChange={(e) => handleChange('uniqueValueProposition', e.target.value)}
                        />
                    </div>
                    <div className="col-span-1 p-4 bg-white rounded-xl border border-gray-200">
                        <label className="text-xs font-bold text-emerald-500 uppercase mb-2 block">9. Advantage</label>
                         <Textarea 
                            placeholder="경쟁 우위 (따라할 수 없는 것)"
                            className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                            value={canvasData.unfairAdvantage}
                            onChange={(e) => handleChange('unfairAdvantage', e.target.value)}
                        />
                    </div>
                    <div className="col-span-1 p-4 bg-white rounded-xl border border-gray-200">
                        <label className="text-xs font-bold text-blue-500 uppercase mb-2 block">2. Customer Segments</label>
                         <Textarea 
                            placeholder="목표 고객군"
                            className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                            value={canvasData.customerSegments}
                            onChange={(e) => handleChange('customerSegments', e.target.value)}
                        />
                    </div>

                    {/* Row 2: Bottom Section */}
                    <div className="col-span-5 grid grid-cols-2 gap-4 h-1/3">
                         <div className="col-span-1 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-xl border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">8. Key Metrics</label>
                                <Textarea 
                                    placeholder="핵심 지표" 
                                    className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                                    value={canvasData.keyMetrics}
                                    onChange={(e) => handleChange('keyMetrics', e.target.value)}
                                />
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-gray-200">
                                <label className="text-xs font-bold text-pink-500 uppercase mb-2 block">5. Channels</label>
                                <Textarea 
                                    placeholder="유통 채널" 
                                    className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                                    value={canvasData.channels}
                                    onChange={(e) => handleChange('channels', e.target.value)}
                                />
                            </div>
                         </div>
                         <div className="col-span-1 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-xl border border-gray-200">
                                <label className="text-xs font-bold text-red-500 uppercase mb-2 block">7. Cost Structure</label>
                                <Textarea 
                                    placeholder="비용 구조" 
                                    className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                                    value={canvasData.costStructure}
                                    onChange={(e) => handleChange('costStructure', e.target.value)}
                                />
                            </div>
                             <div className="p-4 bg-white rounded-xl border border-gray-200">
                                <label className="text-xs font-bold text-green-500 uppercase mb-2 block">6. Revenue Streams</label>
                                <Textarea 
                                    placeholder="수익원" 
                                    className="h-[calc(100%-24px)] resize-none border-0 focus-visible:ring-0 p-0 text-sm"
                                    value={canvasData.revenueStreams}
                                    onChange={(e) => handleChange('revenueStreams', e.target.value)}
                                />
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t bg-white flex justify-between items-center">
            {activeTab === 'create' ? (
                <>
                <div className="text-sm text-gray-500">
                    * 작성된 내용은 프로젝트 본문에 예쁜 디자인으로 삽입됩니다.
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
                    {onApply && (
                         <Button onClick={handleApplyToProject} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                            <Check className="w-4 h-4" /> 프로젝트에 적용하기
                        </Button>
                    )}
                </div>
                </>
            ) : (
                <div className="w-full flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>닫기</Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CanvasHeader({ number, title, subtitle, icon, className }: { number: string, title: string, subtitle: string, icon: string, className?: string }) {
    return (
        <div className={`px-4 py-2 border-b border-gray-200/50 border-dashed flex justify-between items-center ${className} select-none`}>
           <div>
               <h4 className="font-extrabold text-xs uppercase tracking-wide flex items-center gap-2">
                   {title}
               </h4>
               <p className="text-[10px] text-gray-400 font-medium">{subtitle}</p>
           </div>
           <div className="flex items-center gap-2 opacity-50">
               <span className="text-sm grayscale">{icon}</span>
               <span className="text-[10px] font-black border border-current rounded-full w-4 h-4 flex items-center justify-center">{number}</span>
           </div>
        </div>
    )
}

function CanvasBody({ value, onChange, className }: { value: string, onChange: (v: string) => void, className?: string }) {
    return (
        <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`flex-1 w-full h-full resize-none border-0 bg-transparent p-3 text-sm leading-relaxed focus-visible:ring-0 placeholder:text-gray-300 ${className}`}
            placeholder="..."
        />
    )
}
