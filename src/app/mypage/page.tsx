"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { Heart, Folder, Upload, Settings, Grid, Send, MessageCircle, Eye, EyeOff, Lock, Trash2, Camera, UserMinus, AlertTriangle, Loader2, Plus, Edit, Rocket, Sparkles, Wand2, Lightbulb, Zap, UserCircle, Search, Clock, BarChart, ChefHat, Share2, Copy, QrCode, ClipboardList, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { QRCodeCanvas } from "qrcode.react";
import { ProfileManager } from "@/components/ProfileManager";
import { ImageCard } from "@/components/ImageCard";
import { ProposalCard } from "@/components/ProposalCard";
import { CommentCard } from "@/components/CommentCard";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { MyRatingIsHeader } from "@/components/MyRatingIsHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Lazy loaded heavy modals for performance
const ProjectDetailModalV2 = dynamic(() => import("@/components/ProjectDetailModalV2").then(mod => mod.ProjectDetailModalV2), { ssr: false });
const ProposalDetailModal = dynamic(() => import("@/components/ProposalDetailModal").then(mod => mod.ProposalDetailModal), { ssr: false });
const FeedbackReportModal = dynamic(() => import("@/components/FeedbackReportModal").then(mod => mod.FeedbackReportModal), { ssr: false });
const LeanCanvasModal = dynamic(() => import("@/components/LeanCanvasModal").then(mod => mod.LeanCanvasModal), { ssr: false });
const PersonaDefinitionModal = dynamic(() => import("@/components/PersonaDefinitionModal").then(mod => mod.PersonaDefinitionModal), { ssr: false });
const AssistantResultModal = dynamic(() => import("@/components/AssistantResultModal").then(mod => mod.AssistantResultModal), { ssr: false });

// Lazy loaded AI tools
const AiOpportunityExplorer = dynamic(() => import("@/components/tools/AiOpportunityExplorer").then(mod => mod.AiOpportunityExplorer), { ssr: false });
const AiLeanCanvasChat = dynamic(() => import("@/components/tools/AiLeanCanvasChat").then(mod => mod.AiLeanCanvasChat), { ssr: false });
const AiOpportunityChat = dynamic(() => import("@/components/tools/AiOpportunityChat").then(mod => mod.AiOpportunityChat), { ssr: false });
const AiPersonaChat = dynamic(() => import("@/components/tools/AiPersonaChat").then(mod => mod.AiPersonaChat), { ssr: false });
const AiAssistantChat = dynamic(() => import("@/components/tools/AiAssistantChat").then(mod => mod.AiAssistantChat), { ssr: false });
const ApiKeyManager = dynamic(() => import("@/components/ApiKeyManager").then(mod => mod.ApiKeyManager), { ssr: false });
const RewardTab = dynamic(() => import("@/components/RewardTab").then(mod => mod.RewardTab), { ssr: false });

type TabType = 'projects' | 'audit_requests' | 'likes' | 'collections' | 'proposals' | 'comments' | 'rewards' | 'ai_tools' | 'dashboard' | 'settings';
type AiToolType = 'lean-canvas' | 'persona' | 'assistant' | 'job' | 'trend' | 'recipe' | 'tool' | 'api-settings';

// Type imports (not lazy loaded)
import type { LeanCanvasData } from "@/components/LeanCanvasModal";
import type { AssistantData } from "@/components/tools/AiAssistantChat";
import type { PersonaData } from "@/components/PersonaDefinitionModal";

export default function MyPage() {
  const router = useRouter();
  
  // 기본 상태
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [projectFilter, setProjectFilter] = useState<'all' | 'audit' | 'active'>('all');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeAiTool, setActiveAiTool] = useState<AiToolType>('api-settings');
  const [isExplorationStarted, setIsExplorationStarted] = useState(false);
  
  // [New] Feedback Report Modal State
  const [feedbackReportOpen, setFeedbackReportOpen] = useState(false);
  const [currentFeedbackProject, setCurrentFeedbackProject] = useState<{id: string, title: string} | null>(null);

  // AI 도구 데이터 지속성 상태
  const [savedLeanCanvas, setSavedLeanCanvas] = useState<LeanCanvasData | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({ projects: 0, likes: 0, collections: 0, followers: 0, following: 0 });
  
  // 데이터 상태
  const [projects, setProjects] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  // 모달 상태
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  
  // AI 도구 모달 상태
  const [leanModalOpen, setLeanModalOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [assistantModalOpen, setAssistantModalOpen] = useState(false);

  const [savedPersona, setSavedPersona] = useState<PersonaData | null>(null);
  const [savedAssistant, setSavedAssistant] = useState<AssistantData | null>(null);
  
  const handleLeanCanvasGenerate = (data: LeanCanvasData) => {
    setSavedLeanCanvas(data);
    setLeanModalOpen(true);
  };

  const handlePersonaGenerate = (data: PersonaData) => {
    setSavedPersona(data);
    setPersonaModalOpen(true);
  };

  const handleAssistantGenerate = (data: AssistantData) => {
    setSavedAssistant(data);
    setAssistantModalOpen(true);
  };
  
  // 회원탈퇴 관련 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { user: authUser, userProfile: authProfile, loading: authLoading, isAdmin } = useAuth();
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingProject, setSharingProject] = useState<any>(null);
  const isLoadingRef = useRef(false);

  // 1. 초기화 - 사용자 정보 및 통계 로드
  const initStats = async () => {
      if (!authUser || isLoadingRef.current) return;
      isLoadingRef.current = true;
      setUserId(authUser.id);

      try {
        console.log("[MyPage] Starting initStats for:", authUser.id);

        // 1. Fetch Profile from Supabase
        const { data: sbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUserProfile({
          username: sbProfile?.username || authUser.user_metadata?.full_name || 'user',
          nickname: sbProfile?.nickname || authUser.user_metadata?.full_name || '사용자',
          email: authUser.email,
          profile_image_url: sbProfile?.profile_image_url || authUser.user_metadata?.avatar_url || '/globe.svg',
          role: sbProfile?.role || 'user',
          bio: sbProfile?.bio || '',
          cover_image_url: sbProfile?.cover_image_url || null,
          social_links: sbProfile?.social_links || {},
          interests: sbProfile?.interests,
          is_public: sbProfile?.is_public ?? true,
          gender: sbProfile?.gender,
          age_group: sbProfile?.age_group,
          occupation: sbProfile?.occupation,
          expertise: sbProfile?.expertise,
          id: authUser.id,
        });

        // 2. Fetch Stats from Supabase
        try {
            // My evaluations count
            const { count: myEvaluationsCount } = await (supabase as any)
                .from('evaluations')
                .select('*', { count: 'exact', head: true })
                .eq('user_email', authUser.email);

            // My projects count
            const { count: myProjectsCount } = await (supabase as any)
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('author_email', authUser.email);

            // Total likes received on my projects
            const { data: myProjects } = await (supabase as any)
                .from('projects')
                .select('id, likes')
                .eq('author_email', authUser.email);

            const totalLikesReceived = myProjects?.reduce((sum: number, p: any) => sum + (p.likes || 0), 0) || 0;

            setStats({
                projects: myProjectsCount || 0,
                likes: totalLikesReceived,
                collections: myEvaluationsCount || 0,
                followers: 0,
                following: 0
            });
        } catch (statErr) {
            console.warn("Stats fetch failed:", statErr);
        }

      } catch (e) {
        console.warn("[MyPage] initStats failed:", e);
      } finally {
        setInitialized(true);
        isLoadingRef.current = false;
      }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      console.log("[MyPage] No Auth -> Redirecting to login");
      router.push('/login');
      return;
    }
    if (!initialized) {
       initStats();
    }
  }, [authUser, authProfile, authLoading, initialized, router]);

  // 2. 탭 데이터 로드 - userId와 activeTab 변경 시에만
  useEffect(() => {
    if (!userId || !initialized) return;
    
    const loadData = async () => {
      console.log(`[MyPage] loadData started. Tab: ${activeTab}, UserId: ${userId}`);
      setLoading(true);
      setProjects([]);
      
      try {
        if (activeTab === 'projects' || activeTab === 'audit_requests') {
          // Supabase Query
          const { data: projectsData } = await (supabase as any)
            .from('projects')
            .select('*')
            .eq('author_email', authUser?.email || '')
            .order('created_at', { ascending: false });

          let fetchedProjects = await Promise.all((projectsData || []).map(async (data: any) => {
            // Fetch Real-time Rating Count from evaluations table
            let realRatingCount = 0;
            try {
                const { count } = await (supabase as any)
                    .from('evaluations')
                    .select('*', { count: 'exact', head: true })
                    .eq('project_id', data.id);
                realRatingCount = count || 0;
            } catch (e) {
                console.warn("Failed to fetch count for project", data.id);
            }

            return {
              id: data.id,
              title: data.title || '제목 없음',
              thumbnail_url: data.thumbnail_url || '/placeholder.jpg',
              likes: data.likes || 0,
              views: data.views_count || 0,
              rating_count: realRatingCount,
              created_at: data.created_at || new Date().toISOString(),
              description: data.content_text || data.description || '',
              rendering_type: data.rendering_type || 'image',
              alt_description: data.title || '',
              custom_data: data.custom_data,
              scheduled_at: data.scheduled_at,
              visibility: data.visibility || 'public',
              site_url: data.site_url,
            };
          }));

          // Remove unwanted test data
          fetchedProjects = fetchedProjects.filter((p: any) =>
              !p.title?.includes('육각 진단') &&
              !p.title?.includes('오각 진단') &&
              !p.title?.includes('사각 진단') &&
              !p.title?.includes('삼각 진단')
          );

          if (activeTab === 'audit_requests') {
            fetchedProjects = fetchedProjects.filter((p: any) => p.custom_data?.audit_config || p.audit_deadline);
          }

          setProjects(fetchedProjects);
          
        } else if (activeTab === 'likes') {
          // Supabase Query for likes
          try {
             const { data: likesData } = await supabase
                .from('project_likes')
                .select('project_id, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

             const projectIds = likesData?.map(d => d.project_id).filter(Boolean) || [];
             const uniqueProjectIds = Array.from(new Set(projectIds));

             if (uniqueProjectIds.length > 0) {
                 const { data: projectsData } = await (supabase as any)
                    .from('projects')
                    .select('*')
                    .in('id', uniqueProjectIds);

                 const likedProjects = projectsData?.map((data: any) => ({
                    id: data.id,
                    title: data.title || 'No Title',
                    thumbnail_url: data.thumbnail_url || '/placeholder.jpg',
                    likes: data.likes || 0,
                    views: data.views_count || 0,
                    created_at: data.created_at || new Date().toISOString(),
                    description: data.content_text || '',
                    rendering_type: data.rendering_type || 'image',
                 })) || [];

                 setProjects(likedProjects);
             } else {
                 setProjects([]);
             }
          } catch (error) {
             console.error("Error fetching likes:", error);
             setProjects([]);
          }
          
        } else if (activeTab === 'collections') {
          // 컬렉션 목록 로드
          const { data: cols } = await supabase
            .from('Collection')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) as any;
          
          setCollections(cols || []);
          
          if (cols && cols.length > 0) {
            const firstId = cols[0].collection_id;
            setActiveCollectionId(firstId);
            
            // 첫 번째 컬렉션의 아이템 로드
            const { data: items } = await supabase
              .from('CollectionItem')
              .select('*, Project(*)')
              .eq('collection_id', firstId)
              .order('added_at', { ascending: false }) as any;
            
            setProjects((items || []).filter((i: any) => i.Project).map((i: any) => ({
              id: String(i.Project.project_id),
              title: i.Project.title,
              urls: { full: i.Project.thumbnail_url || '/placeholder.jpg', regular: i.Project.thumbnail_url || '/placeholder.jpg' },
              user: { username: 'Creator', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
              likes: i.Project.likes_count || 0,
              views: i.Project.views_count || 0,
            })));
          } else {
            setProjects([]);
          }
          
        } else if (activeTab === 'proposals') {
          // Fetch proposals/inquiries from Supabase
          try {
              // Fetch inquiries where user is receiver OR sender
              const [receivedInquiries, sentInquiries, receivedProposals, sentProposals] = await Promise.all([
                  supabase.from('inquiries').select('*').or(`receiver_uid.eq.${userId},receiver_email.eq.${authUser?.email}`),
                  supabase.from('inquiries').select('*').or(`sender_uid.eq.${userId},sender_email.eq.${authUser?.email}`),
                  (supabase as any).from('proposals').select('*').or(`receiver_uid.eq.${userId},receiver_email.eq.${authUser?.email}`),
                  (supabase as any).from('proposals').select('*').or(`sender_uid.eq.${userId},sender_email.eq.${authUser?.email}`)
              ]);

              const allItems: any[] = [];
              const addedIds = new Set();

              // Helper to add items
              const addItems = (items: any[], type: 'received' | 'sent') => {
                  items?.forEach((data: any) => {
                      const id = data.id;
                      if (addedIds.has(id)) return;
                      addedIds.add(id);

                      allItems.push({
                          proposal_id: id,
                          title: data.title,
                          content: data.content,
                          status: data.status,
                          created_at: data.created_at || new Date().toISOString(),
                          inquiry_type: data.inquiry_type,
                          projectId: data.project_id,
                          projectTitle: data.project_title,
                          type: type,
                          sender: type === 'received' ? {
                              nickname: data.sender_name || 'Anonymous',
                              email: data.sender_email,
                          } : undefined,
                          receiver: type === 'sent' ? {
                              nickname: data.project_title || 'Project',
                          } : undefined,
                          contact: data.sender_email,
                      });
                  });
              };

              addItems(receivedInquiries.data || [], 'received');
              addItems(sentInquiries.data || [], 'sent');
              addItems(receivedProposals.data || [], 'received');
              addItems(sentProposals.data || [], 'sent');

              // Sort by created_at desc
              allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

              setProjects(allItems);
          } catch (error) {
              console.error("Error fetching proposals:", error);
              setProjects([]);
          }
          
        } else if (activeTab === 'comments') {
          // 'Participated Audits' (Evaluations) fetched from Supabase
          try {
              const { data: evaluations } = await (supabase as any)
                  .from('evaluations')
                  .select('*')
                  .eq('user_email', authUser?.email)
                  .order('created_at', { ascending: false });

              if (evaluations && evaluations.length > 0) {
                  // Get Unique Project IDs
                  const uniqueProjectIds = Array.from(new Set(evaluations.map((e: any) => e.project_id)));

                  // Fetch Projects
                  const { data: projectsData } = await (supabase as any)
                      .from('projects')
                      .select('*')
                      .in('id', uniqueProjectIds);

                  const projectsMap: Record<string, any> = {};

                  // Build projects map with real-time counts
                  await Promise.all((projectsData || []).map(async (data: any) => {
                      // Fetch real-time rating count
                      let realRatingCount = 0;
                      try {
                          const { count } = await (supabase as any)
                              .from('evaluations')
                              .select('*', { count: 'exact', head: true })
                              .eq('project_id', data.id);
                          realRatingCount = count || 0;
                      } catch (e) {
                          console.warn("Failed to fetch rating count for project", data.id);
                      }

                      projectsMap[data.id] = {
                          id: data.id,
                          ...data,
                          rating_count: realRatingCount
                      };
                  }));

                  // Map evaluations to display list
                  const participatedList = evaluations.map((ev: any) => {
                      const proj = projectsMap[ev.project_id];
                      if (!proj) return null;

                      return {
                          id: proj.id,
                          title: proj.title || '제목 없음',
                          thumbnail_url: proj.thumbnail_url || '/placeholder.jpg',
                          likes: proj.likes || 0,
                          views: proj.views_count || 0,
                          rating_count: proj.rating_count || 0,
                          created_at: proj.created_at || new Date().toISOString(),
                          description: proj.content_text || proj.description || '',
                          custom_data: proj.custom_data,
                          _evaluation: ev
                      };
                  }).filter(Boolean);

                  setProjects(participatedList);
              } else {
                  setProjects([]);
              }
          } catch (error) {
              console.error("Error fetching evaluations:", error);
              setProjects([]);
          }
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        console.log("[MyPage] loadData finished. Setting loading=false");
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, activeTab, initialized]);

  const localCn = (...classes: any[]) => classes.filter(Boolean).join(' ');

  // 3. 컬렉션 선택 변경 시 아이템 로드
  const handleCollectionChange = async (collectionId: string) => {
    if (collectionId === activeCollectionId) return;
    
    setActiveCollectionId(collectionId);
    setLoading(true);
    
    try {
      const { data: items } = await supabase
        .from('CollectionItem')
        .select('*, Project(*)')
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false }) as any;
      
      setProjects((items || []).filter((i: any) => i.Project).map((i: any) => ({
        id: String(i.Project.project_id),
        title: i.Project.title,
        urls: { full: i.Project.thumbnail_url || '/placeholder.jpg', regular: i.Project.thumbnail_url || '/placeholder.jpg' },
        user: { username: 'Creator', profile_image: { small: '/globe.svg', large: '/globe.svg' } },
        likes: i.Project.likes_count || 0,
        views: i.Project.views_count || 0,
      })));
    } catch (err) {
      console.error('컬렉션 아이템 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("정말로 이 프로젝트를 삭제하시겠습니까?")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      
      if (!response.ok) throw new Error('삭제 실패');
      
      setProjects(prev => prev.filter(p => String(p.id) !== String(projectId)));
      setStats(prev => ({ ...prev, projects: prev.projects - 1 }));
      toast.success("프로젝트가 삭제되었습니다.");
    } catch (err) {
      toast.error("삭제에 실패했습니다.");
    }
  };

  // 프로젝트 공개여부 토글
  const handleToggleVisibility = async (projectId: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    try {
      const { error } = await supabase
        .from('Project')
        .update({ visibility: newVisibility })
        .eq('project_id', parseInt(projectId));

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, visibility: newVisibility } : p
      ));
      
      // toast success (optional)
    } catch (err) {
      console.error(err);
      toast.error("상태 변경에 실패했습니다.");
    }
  };
  
  // 커버 이미지 업로드
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // 용량 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    try {
      setLoading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `cover_${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // profiles 버킷 루트에 저장

      // 1. Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // 3. DB 업데이트
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({ cover_image_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 4. 상태 업데이트
      setUserProfile((prev: any) => ({ ...prev, cover_image_url: publicUrl }));
      toast.success("커버 이미지가 변경되었습니다.");
    } catch (error) {
      console.error('커버 이미지 업로드 실패:', error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 회원탈퇴 처리
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "회원탈퇴") {
      toast.warning("'회원탈퇴'를 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원탈퇴에 실패했습니다.');
      }

      // 로그아웃 처리
      await supabase.auth.signOut();
      
      toast.success('계정이 성공적으로 삭제되었습니다.', { description: '이용해주셔서 감사합니다.' });
      router.push('/');
      
    } catch (error) {
      console.error('회원탈퇴 실패:', error);
      toast.error(error instanceof Error ? error.message : '회원탈퇴에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
    }
  };

  // 초기 로딩 화면
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'projects' as TabType, label: '나의 평가의뢰', icon: ChefHat, color: 'text-chef-text', bgColor: 'bg-chef-text' },
    // { id: 'audit_requests' as TabType, label: '의뢰 현황', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-600' }, // Hidden
    { id: 'comments' as TabType, label: '참여한 평가', icon: MessageCircle, color: 'text-chef-text', bgColor: 'bg-chef-text' },
    { id: 'rewards' as TabType, label: '포인트/보상', icon: Coins, color: 'text-orange-500', bgColor: 'bg-orange-500' },
    { id: 'likes' as TabType, label: '좋아요', icon: Heart, color: 'text-red-500', bgColor: 'bg-red-500' },
    { id: 'collections' as TabType, label: '컬렉션', icon: Folder, color: 'text-indigo-500', bgColor: 'bg-indigo-500' },
    { id: 'proposals' as TabType, label: '1:1 문의', icon: Send, color: 'text-chef-text', bgColor: 'bg-chef-text' },
    // ...(isAdmin ? [{ id: 'dashboard' as TabType, label: '성과 리포트', icon: BarChart, color: 'text-orange-600', bgColor: 'bg-orange-600' }] : []), // Hidden
    { id: 'settings' as TabType, label: '프로필 설정', icon: Settings, color: 'text-chef-text', bgColor: 'bg-chef-text' },
  ];

  return (
    <div className="w-full min-h-screen bg-chef-bg pb-20 transition-colors duration-300">
      
      <div className="w-full max-w-[1440px] mx-auto px-2 md:px-10 pt-18 md:pt-24">
        

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-chef-border mb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 font-black transition-all relative whitespace-nowrap ${isActive ? tab.color : 'text-chef-text opacity-60 hover:opacity-100'}`}
              >
                <Icon size={18} fill={tab.id === 'likes' && isActive ? 'currentColor' : 'none'} />
                <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                {isActive && <div className={`absolute bottom-0 left-0 w-full h-1 ${tab.bgColor}`} />}
              </button>
            );
          })}
        </div>

        {/* 컬렉션 서브탭 */}
        {activeTab === 'collections' && collections.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {collections.map((col: any) => (
              <button
                key={col.collection_id}
                onClick={() => handleCollectionChange(col.collection_id)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCollectionId === col.collection_id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-chef-panel border border-chef-border text-chef-text opacity-60 hover:opacity-100'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : (
          <>
            {/* 내 프로젝트 / 평가 의뢰 / 참여한 평가 탭 */}
            {(activeTab === 'projects' || activeTab === 'audit_requests' || activeTab === 'comments') && (
              <div className="space-y-6">
                {/* [New] Project Sub-filters */}
                {activeTab === 'projects' && (
                  <div className="flex gap-2">
                    <button onClick={() => setProjectFilter('all')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", projectFilter === 'all' ? "bg-chef-text text-chef-bg shadow-xl" : "bg-chef-panel border border-chef-border text-chef-text opacity-60 hover:opacity-100")}>ALL</button>
                    <button onClick={() => setProjectFilter('active')} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", projectFilter === 'active' ? "bg-orange-600 text-white shadow-xl" : "bg-chef-panel border border-chef-border text-chef-text opacity-60 hover:opacity-100")}>PUBLISHED</button>
                  </div>
                )}

                {projects.length > 0 ? (
                  <div className="flex flex-col gap-6 pb-12">
                     {activeTab === 'projects' && (
                        <div 
                          onClick={() => router.push('/project/upload')}
                          className="bg-chef-card rounded-xl border-2 border-dashed border-chef-border hover:border-orange-500/50 overflow-hidden hover:shadow-2xl transition-all cursor-pointer group flex items-center justify-center p-8 gap-6 shadow-sm"
                        >
                          <div className="w-16 h-16 rounded-xl bg-chef-panel flex items-center justify-center transition-all shadow-sm group-hover:shadow-2xl group-hover:bg-orange-600">
                            <Plus className="w-8 h-8 text-chef-text opacity-50 group-hover:text-white group-hover:opacity-100 transition-all" />
                          </div>
                          <div>
                            <p className="text-chef-text font-black text-lg uppercase tracking-tight mb-1">새 프로젝트 의뢰하기</p>
                            <p className="text-chef-text opacity-60 font-bold text-xs uppercase tracking-widest">POST NEW PROJECT FOR AUDIT</p>
                          </div>
                        </div>
                     )}
                    
                    {projects.filter(p => {
                      if (activeTab === 'projects' && projectFilter === 'active') return p.visibility === 'public';
                      return true;
                    }).map((project) => (
                       <div key={project.id} className="bg-chef-card rounded-xl border border-chef-border shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 relative group transition-all">
                         {/* Left: Project Image */}
                         <div className="w-full md:w-72 h-48 md:h-52 bg-chef-panel rounded-[1.5rem] relative overflow-hidden shrink-0 border border-chef-border/50">
                            {/* V-Audit Status Badge */}
                            {(project.custom_data?.audit_config || project.audit_deadline) && (
                               <div className="absolute top-4 left-4 z-10">
                                  <div className="bg-orange-600/90 text-white px-3 py-1.5 bevel-sm text-[10px] font-black tracking-tighter shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                                     <ChefHat size={14} />
                                     전문 평가 진행 중
                                  </div>
                               </div>
                            )}

                            {(() => {
                                const getSmartThumbnail = () => {
                                    if (project.thumbnail_url && !project.thumbnail_url.includes('placeholder')) {
                                        return project.thumbnail_url;
                                    }
                                    const targetUrl = project.site_url || project.custom_data?.audit_config?.mediaA;
                                    if (targetUrl && typeof targetUrl === 'string' && (targetUrl.startsWith('http') || targetUrl.includes('.'))) {
                                        const finalUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
                                        return `https://api.microlink.io/?url=${encodeURIComponent(finalUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
                                    }
                                    return null;
                                };
                                const SmartThumb = getSmartThumbnail();
                                
                                return SmartThumb ? (
                                    <img 
                                        src={SmartThumb} 
                                        alt={project.title} 
                                        className="w-full h-full object-cover transition-opacity duration-500" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-chef-panel to-chef-card opacity-50">
                                        <ChefHat className="w-16 h-16 text-chef-text" />
                                    </div>
                                );
                            })()}
                         </div>

                         {/* Middle: Content Section */}
                         <div className="flex-1 flex flex-col justify-center min-w-0 py-2">
                            <div className="flex items-center gap-2 mb-2">
                               <span className="px-3 py-1 bg-orange-600/10 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-full">
                                    {project.custom_data?.audit_config ? "평가 의뢰" : "프로젝트"}
                               </span>
                               <span className="text-[10px] text-chef-text opacity-50 font-black italic">
                                    {project.visibility === 'public' ? '공개' : '비공개'}
                               </span>
                            </div>

                            <h3 className="text-xl md:text-2xl font-black text-chef-text tracking-tighter truncate mb-2">{project.title}</h3>
                            <p className="text-[11px] text-chef-text opacity-60 font-bold line-clamp-2 mb-6 leading-relaxed">
                                {project.description || project.summary || "작성된 설명이 없습니다."}
                            </p>
                            
                            {/* Evaluation Info for Comments Tab */}
                            {activeTab === 'comments' && project._evaluation && (
                                <div className="mb-4 bg-orange-500/5 border border-orange-500/20 p-3 rounded-xl flex items-center gap-4">
                                    <div className="px-2 py-1 bg-orange-500/10 rounded-md text-orange-600 text-xs font-black">
                                       MY SCORE: {project._evaluation.score?.toFixed(1) || "0.0"}
                                    </div>
                                    <div className="text-xs font-bold text-chef-text opacity-60 truncate">
                                       {project._evaluation.vote_type ? `스티커: ${project._evaluation.vote_type}` : "투표 완료"}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-auto">
                                <div className="flex items-center gap-1.5">
                                   <Eye className="w-3.5 h-3.5 text-chef-text opacity-50" />
                                   <span className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest whitespace-nowrap">조회수 {project.views || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <Heart className="w-3.5 h-3.5 text-chef-text opacity-50" />
                                   <span className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest whitespace-nowrap">좋아요 {project.likes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                                   <span className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest whitespace-nowrap">평가수 {project.rating_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                                   <Clock className="w-3.5 h-3.5 text-chef-text opacity-50" />
                                   <span className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest leading-none whitespace-nowrap">
                                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : "-"}
                                   </span>
                                </div>
                            </div>
                         </div>

                         {/* Right: Actions Section */}
                         <div className="flex flex-col justify-center gap-3 shrink-0 pt-6 md:pt-0 md:border-l md:border-chef-border md:pl-8 md:w-56">
                             <div className="flex flex-col gap-3 w-full">
                                <Button 
                                    onClick={() => router.push(`/report/${project.id}`)}
                                    className="h-12 w-full rounded-2xl bevel-cta bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-600/10 flex items-center justify-center gap-2"
                                >
                                    <BarChart className="w-4 h-4" />
                                    종합 평가 결과
                                </Button>

                                <Button 
                                    onClick={() => router.push(`/report/${project.id}?view=mine`)}
                                    className="h-12 w-full rounded-2xl bg-chef-panel border border-chef-border text-chef-text hover:bg-chef-card hover:text-orange-600 font-bold text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    내 평가 결과
                                </Button>
                             </div>

                             {activeTab !== 'comments' && (
                               <div className="flex gap-2">
                                   <Button 
                                      onClick={(e) => { e.stopPropagation(); router.push(`/project/upload?mode=${project.custom_data?.audit_config ? 'audit' : ''}&edit=${project.id}`); }} 
                                      className="flex-1 h-12 rounded-xl bg-chef-panel border border-chef-border text-chef-text opacity-60 hover:opacity-100 font-bold text-[10px] uppercase tracking-widest transition-all"
                                   >
                                      <Edit className="w-3.5 h-3.5 mr-2" /> 수정
                                   </Button>
                                   <Button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} 
                                      className="w-12 h-12 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all flex items-center justify-center p-0"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                   </Button>
                                   <Button 
                                      onClick={(e) => { e.stopPropagation(); setSharingProject(project); setShareModalOpen(true); }} 
                                      className="w-12 h-12 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-white border border-orange-500/20 transition-all flex items-center justify-center p-0"
                                      title="공유하기"
                                   >
                                      <Share2 className="w-4 h-4" />
                                   </Button>
                                </div>
                             )}

                             {project.visibility === 'private' && (
                                <p className="text-[9px] text-center font-bold text-chef-text opacity-50 uppercase tracking-tighter mt-1 leading-none">
                                    Private Project
                                </p>
                             )}
                         </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 bg-chef-card rounded-xl border border-dashed border-chef-border">
                    <ChefHat className="w-16 h-16 text-chef-text opacity-10 mb-4" />
                    <h3 className="text-xl font-black text-chef-text uppercase tracking-widest">
                        {activeTab === 'comments' ? '참여한 평가가 없습니다' : (activeTab === 'audit_requests' ? '진행 중인 의뢰가 없습니다' : '등록된 프로젝트가 없습니다')}
                    </h3>
                    <Button onClick={() => router.push(activeTab === 'projects' ? '/project/upload' : '/projects')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 h-14 mt-6 font-black uppercase tracking-widest text-xs">
                        {activeTab === 'projects' ? '의뢰하러 가기' : '평가하러 가기'}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {(activeTab === 'likes' || activeTab === 'collections') && (
              projects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                  {projects.map((project) => (
                    <ImageCard key={project.id} props={project} onClick={() => { setSelectedProject(project); setModalOpen(true); }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-chef-card rounded-xl border border-chef-border border-dashed">
                  {activeTab === 'likes' ? <Heart className="w-16 h-16 text-chef-text opacity-10 mb-4" /> : <Folder className="w-16 h-16 text-chef-text opacity-10 mb-4" />}
                  <h3 className="text-xl font-black text-chef-text uppercase tracking-widest">
                    {activeTab === 'likes' ? '찜해둔 요리가 없습니다' : '스크랩북이 비어 있습니다'}
                  </h3>
                  <Button onClick={() => router.push('/projects')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8 h-12 mt-6 font-black uppercase tracking-widest text-[10px]">요리 탐색하기</Button>
                </div>
              )
            )}

            {/* 받은 제안 탭 */}
            {activeTab === 'proposals' && (
              projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                  {projects.map((item) => (
                    <ProposalCard key={item.proposal_id} proposal={item} type="received" onClick={() => { setSelectedProposal(item); setProposalModalOpen(true); }} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-chef-card rounded-xl border border-chef-border border-dashed">
                  <Send className="w-16 h-16 text-chef-text opacity-10 mb-4" />
                  <h3 className="text-xl font-black text-chef-text uppercase tracking-widest">받은 제안이 없습니다</h3>
                </div>
              )
            )}

            {/* 내 댓글 탭 */}


            {/* AI 도구 탭 */}
{activeTab === 'ai_tools' && (
              <div className="flex flex-col md:flex-row gap-8 min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* 왼쪽 사이드 탭 */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                  {[
                    { id: 'job', label: 'AI 채용 정보', icon: Search, desc: '실시간 채용 & 공모전' },
                    { id: 'trend', label: 'AI 트렌드', icon: Rocket, desc: '최신 AI 뉴스 & 동향' },
                    { id: 'recipe', label: 'AI 레시피', icon: Lightbulb, desc: '프롬프트 & 워크플로우' },
                    { id: 'tool', label: 'AI 도구 추천', icon: Zap, desc: '유용한 에이전트 & 서비스' },
                    { type: 'divider' },

                    { id: 'lean-canvas', label: 'AI 린 캔버스', icon: Grid, desc: '사업 모델 구조화' },
                    { id: 'persona', label: 'AI 고객 페르소나', icon: UserCircle, desc: '고객 정의 및 분석' },
                    { id: 'assistant', label: 'AI 콘텐츠 어시스턴트', icon: Wand2, desc: '텍스트 생성 및 다듬기' },
                  ].map((tool, idx) => {
                    if (tool.type === 'divider') {
                        return <div key={`div-${idx}`} className="h-px bg-gray-100 my-2 mx-4" />;
                    }
                    const menuItem = tool as { id: string, label: string, icon: any, desc: string };
                    return (
                        <button
                        key={menuItem.id}
                        onClick={() => {
                            setActiveAiTool(menuItem.id as AiToolType);
                            setIsExplorationStarted(false); 
                        }}
                        className={`flex items-start gap-4 p-4 rounded-2xl transition-all text-left group ${
                            activeAiTool === menuItem.id 
                            ? 'bg-white border-2 border-purple-100 shadow-md ring-4 ring-purple-50/50' 
                            : 'hover:bg-gray-100 dark:hover:bg-white/10 border-2 border-transparent text-gray-500'
                        }`}
                        >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                            activeAiTool === menuItem.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500'
                        }`}>
                            <menuItem.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className={`font-bold text-sm ${activeAiTool === menuItem.id ? 'text-gray-900' : 'text-gray-600'}`}>{menuItem.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{menuItem.desc}</p>
                        </div>
                        </button>
                    )
                  })}
                </div>

                {/* 오른쪽 콘텐츠 영역 */}
                <div className="flex-1 bg-chef-card rounded-xl border border-chef-border shadow-sm p-0 md:p-0 relative overflow-hidden group">
                  {/* Futuristic Background Decor */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl opacity-50 -mr-32 -mt-32 transition-all group-hover:opacity-60 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl opacity-50 -ml-16 -mb-16 transition-all group-hover:opacity-60 pointer-events-none" />
                  
                  {['job', 'trend', 'recipe', 'tool'].includes(activeAiTool) ? (
                       <div className="h-full flex flex-col relative z-10">
                            <div className="p-8 pb-4 border-b border-chef-border bg-chef-card/50 backdrop-blur-sm">
                               <h2 className="text-xl font-black text-chef-text flex items-center gap-2 mb-1">
                                  {activeAiTool === 'job' && <><Search className="text-blue-500 w-6 h-6"/> AI 채용 정보</>}
                                  {activeAiTool === 'trend' && <><Rocket className="text-purple-500 w-6 h-6"/> AI 트렌드</>}
                                  {activeAiTool === 'recipe' && <><Lightbulb className="text-amber-500 w-6 h-6"/> AI 레시피</>}
                                  {activeAiTool === 'tool' && <><Zap className="text-yellow-500 w-6 h-6"/> AI 도구 추천</>}
                               </h2>
                               <p className="text-sm text-chef-text opacity-60 pl-8">
                                  {activeAiTool === 'job' && "최신 AI 프롬프트 엔지니어링 채용 공고와 해커톤 정보를 확인하세요."}
                                  {activeAiTool === 'trend' && "매일 업데이트되는 글로벌 AI 업계의 최신 동향과 뉴스 링크를 제공합니다."}
                                  {activeAiTool === 'recipe' && "다양한 이미지 생성 프롬프트 스타일과 워크플로우를 발견하고 적용해보세요."}
                                  {activeAiTool === 'tool' && "작업 효율을 극대화해줄 최신 AI 에이전트와 서비스를 추천해드립니다."}
                               </p>
                           </div>
                           <div className="flex-1 overflow-hidden">
                               <AiOpportunityChat category={activeAiTool as 'job' | 'trend' | 'recipe' | 'tool'} />
                           </div>
                       </div>
                   ) : activeAiTool === 'lean-canvas' ? (
                        <div className="h-full relative z-10">
                             <AiLeanCanvasChat onGenerate={handleLeanCanvasGenerate} />
                        </div>
                   ) : activeAiTool === 'persona' ? (
                        <div className="h-full relative z-10">
                             <AiPersonaChat onGenerate={handlePersonaGenerate} />
                        </div>
                   ) : activeAiTool === 'assistant' ? (
                        <div className="h-full relative z-10">
                             <AiAssistantChat onGenerate={handleAssistantGenerate} />
                        </div>

                   ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto space-y-6 py-20 px-8">
                        {/* Fallback Intro or Empty State */}
                        <div className="w-20 h-20 rounded-xl bg-chef-panel flex items-center justify-center text-chef-text opacity-50">
                             <Sparkles className="w-10 h-10" />
                        </div>
                        <p className="text-chef-text opacity-60">도구를 선택해주세요.</p>
                    </div>
                   )}
                </div>
              </div>
            )}
            {activeTab === 'rewards' && (
               <div className="bg-chef-card rounded-xl border border-chef-border p-12 text-center space-y-4 shadow-sm">
                 <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
                   <Coins className="w-8 h-8 text-orange-500" />
                 </div>
                 <h3 className="text-xl font-black text-chef-text">포인트/보상 시스템 준비중</h3>
                 <p className="text-sm text-chef-text/60 font-medium max-w-md mx-auto">
                   평가 참여에 대한 포인트 적립 및 보상 기능을 준비하고 있습니다.<br />더 나은 서비스로 곧 찾아뵙겠습니다.
                 </p>
               </div>
            )}
            {activeTab === 'settings' && userProfile && (
               <div className="bg-chef-card rounded-xl border border-chef-border p-8 shadow-sm">
                  <ProfileManager user={userProfile} onUpdate={initStats} />
               </div>
            )}
            {activeTab === 'dashboard' && isAdmin && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-chef-card p-8 rounded-xl border border-chef-border shadow-sm space-y-2">
                          <p className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest">총 노출수</p>
                          <h4 className="text-4xl font-black italic tracking-tighter text-chef-text">24,802</h4>
                          <div className="text-xs font-bold text-green-600 flex items-center gap-1">
                             <Rocket size={14} /> +12% from last week
                          </div>
                      </div>
                      <div className="bg-chef-card p-8 rounded-xl border border-chef-border shadow-sm space-y-2">
                          <p className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest">평가 참여율</p>
                          <h4 className="text-4xl font-black italic tracking-tighter text-chef-text">4.8%</h4>
                          <div className="text-xs font-bold text-orange-600 flex items-center gap-1">
                             <Sparkles size={14} /> High Engagement
                          </div>
                      </div>
                      <div className="bg-chef-card p-8 rounded-xl border border-chef-border shadow-sm space-y-2">
                          <p className="text-[10px] font-black text-chef-text opacity-60 uppercase tracking-widest">전환 포인트</p>
                          <h4 className="text-4xl font-black italic tracking-tighter text-chef-text">860P</h4>
                          <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                             <BarChart size={14} /> Stable Flow
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-chef-card p-10 rounded-xl border border-chef-border shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center space-y-6">
                      <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center text-orange-600">
                         <BarChart size={40} />
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-2xl font-black text-chef-text italic uppercase">Deep Analytics Coming Soon</h3>
                         <p className="text-chef-text opacity-60 font-bold max-w-sm">프로젝트별 유입 경로, 체류 시간, 문항별 정밀 분석 데이터를 준비 중입니다. 관리자 권한으로 초안을 확인하고 계십니다.</p>
                      </div>
                  </div>
               </div>
            )}
          </>
        )}
      </div>

      {/* 모달 */}
      <ProjectDetailModalV2 open={modalOpen} onOpenChange={setModalOpen} project={selectedProject} />
      <ProposalDetailModal open={proposalModalOpen} onOpenChange={setProposalModalOpen} proposal={selectedProposal} />
      <LeanCanvasModal 
        open={leanModalOpen} 
        onOpenChange={setLeanModalOpen} 
        onSave={(data) => setSavedLeanCanvas(data)}
        initialData={savedLeanCanvas || undefined}
      />
      <PersonaDefinitionModal 
        open={personaModalOpen} 
        onOpenChange={setPersonaModalOpen} 
        onSave={(data) => setSavedPersona(data)}
        initialData={savedPersona || undefined}
        onApply={() => {}} 
      />
      <AssistantResultModal
        open={assistantModalOpen}
        onOpenChange={setAssistantModalOpen}
        onSave={(data) => setSavedAssistant(data)}
        initialData={savedAssistant || undefined}
        onApply={() => {}}
      />
      
      {/* 회원탈퇴 확인 모달 */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl text-red-600">회원탈퇴</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  이 작업은 되돌릴 수 없습니다.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ 삭제되는 데이터</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 업로드한 모든 프로젝트</li>
                <li>• 좋아요, 댓글, 팔로우 기록</li>
                <li>• 컬렉션 및 저장된 항목</li>
                <li>• 받은 제안 및 평가 의견</li>
                <li>• 프로필 정보</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                탈퇴를 확인하려면 <span className="font-bold text-red-600">"회원탈퇴"</span>를 입력하세요
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "회원탈퇴" || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <UserMinus className="w-4 h-4 mr-2" />
                  회원탈퇴
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {currentFeedbackProject && (
        <FeedbackReportModal 
          open={feedbackReportOpen} 
          onOpenChange={setFeedbackReportOpen}
          projectId={currentFeedbackProject.id}
          projectTitle={currentFeedbackProject.title}
        />
      )}
      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="max-w-md bg-chef-card border-chef-border text-chef-text rounded-xl p-10 overflow-hidden">
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black tracking-tighter uppercase italic">프로젝트 공유</h3>
              <p className="text-xs font-bold text-chef-text opacity-60 uppercase tracking-widest">링크 또는 QR코드로 공유하세요</p>
            </div>

            <div className="flex flex-col items-center gap-6 p-8 bg-chef-panel rounded-xl border border-chef-border/50">
               <div className="p-4 bg-white rounded-2xl shadow-2xl">
                   <QRCodeCanvas 
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/review/viewer?projectId=${sharingProject?.id}`} 
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
               </div>
               <div className="w-full space-y-3">
                  <Label className="text-[10px] font-black opacity-50 uppercase tracking-widest">평가 참여 링크</Label>
                  <div className="flex gap-2">
                    <Input 
                        readOnly 
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/review/viewer?projectId=${sharingProject?.id}`} 
                        className="flex-1 bg-chef-card border-chef-border h-12 text-xs font-bold"
                    />
                    <Button 
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/review/viewer?projectId=${sharingProject?.id}`);
                            toast.success("링크가 복사되었습니다!");
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white w-12 h-12 p-0 rounded-xl bevel-sm"
                    >
                        <Copy size={16} />
                    </Button>
                  </div>
               </div>
            </div>

            <Button onClick={() => setShareModalOpen(false)} className="w-full h-16 bg-chef-text text-chef-bg font-black rounded-2xl bevel-cta">
              닫기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
