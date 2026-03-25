"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Send, Bot, User, Grid } from "lucide-react";
import { toast } from "sonner";
import { LeanCanvasData } from "../LeanCanvasModal";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiLeanCanvasChatProps {
  onGenerate: (data: LeanCanvasData) => void;
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

export function AiLeanCanvasChat({ onGenerate }: AiLeanCanvasChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'assistant', 
        content: "안녕하세요! AI 비즈니스 코치입니다. 🤖\n구상하고 계신 아이디어나 사업 아이템에 대해 편하게 말씀해 주세요. 제가 질문을 드리며 린 캔버스를 완성을 도와드릴게요." 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
        const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                category: 'lean-canvas'
                // sessionId could be tracked if we want history
            })
        });

        if (!res.ok) throw new Error("AI 응답을 가져오지 못했습니다.");
        const data = await res.json();
        
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'assistant', 
            content: data.answer || "죄송합니다. 오류가 발생했습니다."
        }]);
    } catch (e) {
        console.error(e);
        toast.error("AI와 연결하는 중 오류가 발생했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleCreateCanvas = async () => {
    if (messages.length < 2) {
        toast.error("아이디어를 충분히 설명한 후 생성해주세요.");
        return;
    }
    
    setIsLoading(true);
    try {
        // Collect user messages to define the topic better
        const topic = messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join(' ');

        const res = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'lean-canvas',
                topic: topic
            })
        });

        if (!res.ok) throw new Error("AI 생성에 실패했습니다.");
        
        const data = await res.json();
        
        // Match the data structure expected by LeanCanvasModal
        const generatedData: LeanCanvasData = {
            problem: data.problem || "",
            customerSegments: data.customerSegments || "",
            uniqueValueProposition: data.uniqueValueProposition || "",
            solution: data.solution || "",
            channels: data.channels || "",
            revenueStreams: data.revenueStreams || "",
            costStructure: data.costStructure || "",
            keyMetrics: data.keyMetrics || "",
            unfairAdvantage: data.unfairAdvantage || "",
        };
        
        onGenerate(generatedData);
        toast.success("AI가 린 캔버스를 생성했습니다! 아래에서 확인해보세요.");
    } catch (e: any) {
        console.error(e);
        toast.error(e.message || "오류가 발생했습니다.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-chef-bg relative">
      {/* Header Area */}
      <div className="p-6 border-b border-chef-border flex justify-between items-center bg-chef-card/95 backdrop-blur-sm z-10 shrink-0">
        <div>
            <h2 className="text-xl font-black text-chef-text flex items-center gap-2 mb-1">
                <Grid className="mb-0.5 w-6 h-6 text-purple-600"/> 
                AI 린 캔버스
            </h2>
            <p className="text-sm text-chef-text opacity-40 pl-8">
                AI와 대화하며 비즈니스 아이디어를 구체화하고 린 캔버스를 자동으로 생성하세요.
            </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-chef-panel/30">
        {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200 shadow-sm">
                        <Bot className="w-6 h-6 text-purple-600" />
                    </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] md:max-w-[70%] text-sm md:text-base shadow-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    m.role === 'user' 
                    ? 'bg-gradient-to-br from-chef-text to-chef-text/80 text-chef-bg rounded-tr-none shadow-md' 
                    : 'bg-chef-card border border-chef-border text-chef-text rounded-tl-none'
                }`}>
                    {m.content}
                </div>
                {m.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-chef-panel flex items-center justify-center shrink-0 border border-chef-border">
                        <User className="w-6 h-6 text-chef-text opacity-40" />
                    </div>
                )}
            </div>
        ))}
        {isLoading && (
            <div className="flex gap-4 justify-start">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                    <Bot className="w-6 h-6 text-purple-600" />
                </div>
                <div className="p-4 rounded-2xl bg-chef-card border border-chef-border text-chef-text opacity-40 rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="animate-pulse">분석 중입니다...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-chef-card border-t border-chef-border shrink-0 shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
            <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                placeholder="아이디어를 자유롭게 설명해주세요... (Shift+Enter로 줄바꿈)"
                className="min-h-[56px] max-h-[120px] resize-none border-chef-border focus:border-purple-600 focus:ring-purple-200 bg-chef-panel p-3.5 text-base rounded-xl text-chef-text"
            />
            <div className="flex flex-col gap-2 shrink-0">
                <Button 
                    onClick={handleSendMessage} 
                    disabled={!input.trim() || isLoading}
                    className="h-[56px] w-[56px] rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </Button>
            </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3 flex justify-end">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCreateCanvas}
                disabled={isLoading || messages.length < 2} // Require at least some conversation
                className="text-purple-700 border-purple-200 hover:bg-purple-50 gap-2 font-semibold shadow-sm"
            >
                <Wand2 className="w-4 h-4" />
                현재 대화로 린 캔버스 결과물 열기
            </Button>
        </div>
      </div>
    </div>
  );
}
