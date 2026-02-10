"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Send, Lock, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/lib/auth/AuthContext";

interface InquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    project_id?: number | string;
    id?: number | string;
    title: string;
    user_id?: string;
    author_uid?: string;
    author_email?: string;
  };
}

export function InquiryModal({ open, onOpenChange, project }: InquiryModalProps) {
  const { user } = useAuth();
  
  const [inquiryType, setInquiryType] = useState('general'); // general | proposal
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
        // Pre-fill user info
        setContactName(user.user_metadata?.full_name || "");
        setContactEmail(user.email || "");
        setTitle("");
        setContent("");
        setContactPhone("");
        setInquiryType('general');
    }
  }, [open, user]);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error("제목을 입력해주세요.");
    if (!content.trim()) return toast.error("문의 내용을 입력해주세요.");
    if (!contactEmail.trim()) return toast.error("이메일을 입력해주세요.");
    if (!user) return toast.error("로그인이 필요합니다.");

    setIsSubmitting(true);
    try {
        const projectId = project.project_id || project.id;
        const receiverUid = project.author_uid || project.user_id;
        
        const inquiryData = {
            projectId: projectId,
            projectTitle: project.title,
            receiverUid: receiverUid,
            receiverEmail: project.author_email || null,
            senderUid: user.id,
            senderEmail: user.email,
            senderName: contactName.trim(),
            senderPhone: contactPhone.trim() || null,
            title: title.trim(),
            content: content.trim(),
            inquiryType: inquiryType,
            isPrivate: isPrivate,
            status: 'pending',
            createdAt: serverTimestamp(),
            readAt: null,
            repliedAt: null,
        };

        await addDoc(collection(db, "inquiries"), inquiryData);

        toast.success(inquiryType === 'proposal' ? "제안서가 전달되었습니다." : "문의가 등록되었습니다.");
        onOpenChange(false);
    } catch (error: any) {
        console.error("Inquiry Error:", error);
        toast.error("전송 실패: " + error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-chef-card text-chef-text border-chef-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                    {inquiryType === 'proposal' ? <Sparkles className="w-6 h-6 text-purple-500" /> : <MessageCircle className="w-6 h-6 text-orange-600" />}
                    {inquiryType === 'proposal' ? "1:1 제안하기" : "1:1 문의하기"}
                </DialogTitle>
                <DialogDescription className="text-chef-text opacity-60">
                    <span className="font-bold text-chef-text">{project.title}</span> 프로젝트에 대해 궁금한 점이나 제안할 내용이 있나요?
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
                {/* Type Selection */}
                <div className="space-y-3">
                    <Label className="text-sm font-bold opacity-80">문의 유형</Label>
                    <RadioGroup defaultValue="general" value={inquiryType} onValueChange={setInquiryType} className="grid grid-cols-2 gap-4">
                        <div className={`flex items-center justify-center space-x-2 border rounded-xl p-4 cursor-pointer transition-all ${inquiryType === 'general' ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/20' : 'border-chef-border hover:bg-chef-panel'}`}>
                            <RadioGroupItem value="general" id="r-general" />
                            <Label htmlFor="r-general" className="cursor-pointer font-bold">궁금해요 (문의)</Label>
                        </div>
                        <div className={`flex items-center justify-center space-x-2 border rounded-xl p-4 cursor-pointer transition-all ${inquiryType === 'proposal' ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/20' : 'border-chef-border hover:bg-chef-panel'}`}>
                            <RadioGroupItem value="proposal" id="r-proposal" />
                            <Label htmlFor="r-proposal" className="cursor-pointer font-bold">함께해요 (제안)</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Contact Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>이름 *</Label>
                        <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="홍길동" className="bg-chef-panel border-chef-border" />
                    </div>
                    <div className="space-y-2">
                        <Label>이메일 *</Label>
                        <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="example@email.com" className="bg-chef-panel border-chef-border" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>연락처</Label>
                    <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="010-1234-5678" className="bg-chef-panel border-chef-border" />
                </div>

                <div className="space-y-2">
                    <Label>제목 *</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={inquiryType === 'proposal' ? "제안서 제목을 입력해주세요" : "문의 제목을 입력해주세요"} className="bg-chef-panel border-chef-border font-bold" />
                </div>
                
                <div className="space-y-2">
                    <Label>내용 *</Label>
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={inquiryType === 'proposal' ? "제안하실 내용을 자세히 적어주세요." : "문의하실 내용을 자세히 적어주세요."}
                        className="bg-chef-panel border-chef-border min-h-[150px] resize-none focus-visible:ring-orange-500"
                    />
                </div>
                
                <div className="flex items-center justify-between bg-chef-panel p-4 rounded-lg border border-chef-border">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-chef-text opacity-60" />
                        <div className="text-sm">
                            <span className="font-bold block">비공개로 보내기</span>
                            <span className="text-xs opacity-60">창작자와 나만 볼 수 있습니다.</span>
                        </div>
                    </div>
                    <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className={`text-white font-bold ${inquiryType === 'proposal' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {inquiryType === 'proposal' ? "제안서 보내기" : "문의하기"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
