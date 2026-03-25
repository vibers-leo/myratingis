"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Bookmark, Loader2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

interface CollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: {
    project_id?: number | string;
    id?: number | string;
    title: string;
  };
  onSuccess?: () => void;
}

export function CollectionModal({ open, onOpenChange, project, onSuccess }: CollectionModalProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("new");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
        fetchCollections();
    }
  }, [open, user]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
        const { data } = await supabase.from('Collection').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
        if (data) setCollections(data);
    } catch (e) {} finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
      if (!user) return;
      setIsSubmitting(true);
      try {
          const projectId = project.project_id || project.id;
          let collectionId = selectedCollection;

          if (selectedCollection === 'new') {
              if (!newCollectionName.trim()) {
                  toast.error("새 컬렉션 이름을 입력해주세요.");
                  setIsSubmitting(false);
                  return;
              }
              // Create new collection
              const { data, error } = await supabase.from('Collection').insert({
                  user_id: user.id,
                  name: newCollectionName.trim()
                  // is_public removed as it is not in schema
              }).select().single();
              
              if (error) throw error;
              collectionId = data.collection_id;
          }

          // Add item
          if (!projectId) throw new Error("Invalid Project ID");
          const { error: itemError } = await supabase.from('CollectionItem').insert({
              collection_id: collectionId,
              project_id: Number(projectId)
          });

          if (itemError) {
              if (itemError.code === '23505') { // Unique constraint
                  toast.success("이미 보관함에 있습니다.");
              } else {
                  throw itemError;
              }
          } else {
              toast.success("보관함에 저장되었습니다!");
          }
          
          if (onSuccess) onSuccess();
          onOpenChange(false);
          setNewCollectionName("");
          setSelectedCollection("new");
      } catch (error: any) {
          console.error("Collection Save Error:", error);
          toast.error("저장 실패: " + error.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-chef-card text-chef-text border-chef-border">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                    <Bookmark className="w-5 h-5 text-orange-600" />
                    보관함에 저장
                </DialogTitle>
                <DialogDescription className="text-chef-text opacity-60">
                    <span className="font-bold text-chef-text">{project.title}</span> 프로젝트를 저장할 보관함을 선택하세요.
                </DialogDescription>
            </DialogHeader>

            <div className="py-4">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-orange-600" /></div>
                ) : (
                    <RadioGroup value={selectedCollection} onValueChange={setSelectedCollection} className="space-y-3">
                        {/* List existing collections */}
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1">
                            {collections.map(c => (
                                <div key={c.collection_id} className="flex items-center justify-between p-3 rounded-xl border border-chef-border bg-chef-panel cursor-pointer hover:border-orange-500 transition-all [&:has([data-state=checked])]:border-orange-600 [&:has([data-state=checked])]:bg-orange-50 dark:[&:has([data-state=checked])]:bg-orange-950/30">
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value={String(c.collection_id)} id={String(c.collection_id)} />
                                        <Label htmlFor={String(c.collection_id)} className="cursor-pointer font-bold">
                                            {c.name}
                                        </Label>
                                    </div>
                                    <span className="text-xs text-chef-text opacity-40">
                                        {c.is_public ? '공개' : '비공개'}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* New Collection Option */}
                        <div className="p-3 rounded-xl border border-chef-border bg-chef-panel [&:has([data-state=checked])]:border-orange-600">
                             <div className="flex items-center gap-3 mb-2">
                                <RadioGroupItem value="new" id="new" />
                                <Label htmlFor="new" className="cursor-pointer font-bold flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> 새 보관함 만들기
                                </Label>
                             </div>
                             {selectedCollection === 'new' && (
                                 <div className="pl-7 animate-in fade-in slide-in-from-top-1">
                                     <Input 
                                        value={newCollectionName}
                                        onChange={e => setNewCollectionName(e.target.value)}
                                        placeholder="보관함 이름 (예: 디자인 레퍼런스)"
                                        className="bg-chef-card border-chef-border h-10"
                                        autoFocus
                                     />
                                 </div>
                             )}
                        </div>
                    </RadioGroup>
                )}
            </div>

            <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
                <Button onClick={handleSave} disabled={isSubmitting || loading} className="bg-orange-600 hover:bg-orange-700 text-white">
                    {isSubmitting ? "저장 중..." : "저장하기"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
