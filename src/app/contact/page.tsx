"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// ... (Button, Input etc imports)

function ContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    message: "",
  });

  // URL 쿼리 파라미터에서 제목 가져오기 (예: 광고 문의 시)
  useEffect(() => {
    const titleParam = searchParams.get("title");
    if (titleParam) {
      setFormData(prev => ({ ...prev, title: titleParam }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "문의 전송 중 오류가 발생했습니다.");
      }

      toast.success("문의가 성공적으로 접수되었습니다.", { description: "담당자가 확인 후 답변드리겠습니다." });
      router.push("/");
    } catch (error: any) {
      console.error("문의 전송 오류:", error);
      toast.error(error.message || "문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl bg-chef-card border-chef-border text-chef-text shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="text-center pt-10 pb-6">
          <CardTitle className="text-4xl font-black italic uppercase tracking-tighter">문의하기</CardTitle>
          <CardDescription className="text-chef-text opacity-60 text-lg mt-3 font-medium break-keep">
            궁금한 점이나 제안하고 싶은 내용을 남겨주세요.<br />
            빠른 시일 내에 답변해 드리겠습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="name" className="text-sm font-bold opacity-80 pl-1">이름 <span className="text-orange-500">*</span></label>
                <Input
                  id="name"
                  name="name"
                  placeholder="홍길동"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-chef-panel border-chef-border h-14 rounded-2xl focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="email" className="text-sm font-bold opacity-80 pl-1">이메일 <span className="text-orange-500">*</span></label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-chef-panel border-chef-border h-14 rounded-2xl focus-visible:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label htmlFor="phone" className="text-sm font-bold opacity-80 pl-1">연락처</label>
              <Input
                id="phone"
                name="phone"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
                className="bg-chef-panel border-chef-border h-14 rounded-2xl focus-visible:ring-orange-500"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="title" className="text-sm font-bold opacity-80 pl-1">제목</label>
              <Input
                id="title"
                name="title"
                placeholder="문의 제목을 입력해주세요"
                value={formData.title}
                onChange={handleChange}
                className="bg-chef-panel border-chef-border h-14 rounded-2xl font-bold focus-visible:ring-orange-500"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="message" className="text-sm font-bold opacity-80 pl-1">문의 내용 <span className="text-orange-500">*</span></label>
              <Textarea
                id="message"
                name="message"
                placeholder="문의하실 내용을 자세히 적어주세요."
                required
                className="min-h-[180px] bg-chef-panel border-chef-border rounded-2xl p-5 focus-visible:ring-orange-500 resize-none"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full text-lg font-black h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl shadow-lg shadow-orange-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  전송 중...
                </>
              ) : (
                <>
                  <Send className="mr-3 h-5 w-5" />
                  문의하기
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Suspense fallback={<div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-orange-600 w-10 h-10" /><p className="text-orange-600 font-bold uppercase tracking-widest text-xs">Loading...</p></div>}>
        <ContactForm />
      </Suspense>
    </div>
  );
}
