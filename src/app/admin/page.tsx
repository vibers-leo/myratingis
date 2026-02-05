// src/app/admin/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Image as ImageIcon,
  Users,
  Briefcase,
  MessageCircle,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Eye,
  Trash2,
  AlertCircle,
  Loader2,
  Megaphone,
  HelpCircle,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Mail,
} from "lucide-react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Line
} from 'recharts';
import Link from "next/link";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isAdminLoading, userId } = useAdmin();
  const [stats, setStats] = useState({
    todayVisits: 0,
    totalProjects: 0,
    totalUsers: 0,
    totalInquiries: 0,
    totalRecruitItems: 0,
    totalBanners: 0,
    totalNotices: 0,
    totalFaqs: 0,
    totalPopups: 0,
    projectGrowth: 0,
  });
  const [activeTab, setActiveTab] = useState<'projects' | 'inquiries'>('projects');
  const [hoveredChartData, setHoveredChartData] = useState<any | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [statsRange, setStatsRange] = useState(7); // 최근 7일(기본) or 30일

  // 관리자가 아니면 접근 차단
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      alert('관리자 권한이 필요합니다.');
      router.push('/');
    }
  }, [isAdmin, isAdminLoading, router]);

  // 통계 및 최근 데이터 로드 (CSR 안전)
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;
    if (!isAdmin) return;

    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        // 프로젝트 수
        const { count: projectCount } = await supabase
          .from('Project')
          .select('*', { count: 'exact', head: true });

        // 사용자 수
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // 공지사항 수
        const { count: noticeCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true });

        // 문의사항 수
        const { count: inquiryCount } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true });

        // 채용/공모전 수
        const { count: recruitCount } = await supabase
          .from('recruit_items')
          .select('*', { count: 'exact', head: true });

        // 활성 배너 수
        const { count: bannerCount } = await supabase
          .from('banners')
          .select('*', { count: 'exact', head: true });

        // FAQ 수
        const { count: faqCount } = await supabase
          .from('faqs')
          .select('*', { count: 'exact', head: true });

        // 팝업 수 (공지사항 중 팝업으로 설정된 것)
        const { count: popupCount } = await supabase
          .from('notices')
          .select('*', { count: 'exact', head: true })
          .eq('is_popup', true);

        // 최근 프로젝트
        const { data: projects } = await supabase
          .from('Project')
          .select(`
            *,
            profiles (username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        // 최근 문의
        const { data: recentInqs } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentInquiries(recentInqs || []);

        // 주간 데이터 (최근 statsRange일) - 실제 데이터 병렬 조회
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const statsData = [];
        let currentWeekProjectCount = 0; // 성장률 계산용 (최근 7일 기준)

        for (let i = statsRange - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          
          const startDate = new Date(d);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(d);
          endDate.setHours(23, 59, 59, 999);

          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          const queryDateStart = startDate.toISOString();
          const queryDateEnd = endDate.toISOString();

          // 4가지 지표 병렬 조회
          const [visitRes, userRes, projectRes, recruitRes] = await Promise.all([
            (supabase as any).from('site_stats').select('visits').eq('date', dateStr).maybeSingle(),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
            supabase.from('Project').select('project_id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
            supabase.from('recruit_items').select('id', { count: 'exact', head: true }).gte('created_at', queryDateStart).lte('created_at', queryDateEnd),
          ]);
          
          const pCount = projectRes.count || 0;
          if (i < 7) currentWeekProjectCount += pCount;

          statsData.push({
            day: days[d.getDay()],
            visits: visitRes.data?.visits || 0,
            users: userRes.count || 0,
            projects: pCount,
            recruits: recruitRes.count || 0,
            date: dateStr,
            fullDate: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
            displayDate: statsRange > 7 
              ? `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
              : `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`
          });
        }
        
        setWeeklyData(statsData);

        // 성장률 계산을 위한 지난주 데이터 (프로젝트 기준)
        const prevWeekStart = new Date();
        prevWeekStart.setDate(prevWeekStart.getDate() - 14);
        const prevWeekEnd = new Date();
        prevWeekEnd.setDate(prevWeekEnd.getDate() - 8);
        
        const { count: lastWeekCount } = await supabase
          .from('Project')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', prevWeekStart.toISOString())
          .lt('created_at', prevWeekEnd.toISOString());

        // 성장률 계산 (기존 로직 유지)
        const growth = (lastWeekCount || 0) === 0 ? (currentWeekProjectCount > 0 ? 100 : 0) : Math.round(((currentWeekProjectCount - (lastWeekCount || 0)) / (lastWeekCount || 0)) * 100);

        // 오늘 방문자수 조회
        let todayVisits = 0;
        try {
          const { data: visitData } = await (supabase as any)
            .from('site_stats')
            .select('visits')
            .eq('date', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`)
            .maybeSingle();
          todayVisits = visitData?.visits || 0;
        } catch (e) { console.warn('site_stats error', e); }

        setStats({
          todayVisits,
          totalProjects: projectCount || 0,
          totalUsers: userCount || 0,
          totalInquiries: inquiryCount || 0,
          totalRecruitItems: recruitCount || 0,
          totalBanners: bannerCount || 0,
          totalNotices: noticeCount || 0,
          totalFaqs: faqCount || 0,
          totalPopups: popupCount || 0,
          projectGrowth: growth,
        });

        setRecentProjects(projects || []);
      } catch (error) {
        console.error('통계 로드 실패:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [isAdmin, statsRange]);

  const adminMenus = [
    {
      title: "공지사항 관리",
      description: "서비스 공지 및 이벤트 소식 등록",
      icon: Megaphone,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      path: "/admin/notices",
      count: stats.totalNotices,
    },
    {
      title: "FAQ 관리",
      description: "자주 묻는 질문 등록 및 관리",
      icon: HelpCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      path: "/admin/faqs",
      count: stats.totalFaqs,
    },
    {
      title: "배너 관리",
      description: "메인 페이지 배너 업로드 및 관리",
      icon: ImageIcon,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      path: "/admin/banners",
      count: stats.totalBanners,
    },
    {
      title: "프로젝트 관리",
      description: "등록된 프로젝트 조회 및 관리",
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      path: "/admin/projects",
      count: stats.totalProjects,
    },
    {
      title: "채용/공모전 관리",
      description: "채용, 공모전, 이벤트 관리",
      icon: Briefcase,
      color: "text-green-500",
      bgColor: "bg-green-50",
      path: "/admin/recruit",
      count: stats.totalRecruitItems,
    },
    {
      title: "문의 관리",
      description: "1:1 문의 내역 조회 및 답변",
      icon: MessageCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      path: "/admin/inquiries",
      count: stats.totalInquiries,
    },
    {
      title: "이메일 관리",
      description: "이메일 발송 및 수신 관리",
      icon: Mail,
      color: "text-cyan-500",
      bgColor: "bg-cyan-50",
      path: "/admin/emails",
      count: 0,
    },
    {
      title: "사용자 관리",
      description: "회원 정보 조회 및 관리",
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      path: "/admin/users",
      count: stats.totalUsers,
    },
    {
      title: "통계",
      description: "사이트 통계 및 분석",
      icon: BarChart3,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      path: "/admin/stats",
      count: 0,
    },
  ];

  // 로딩 중일 때
  if (isAdminLoading || isLoadingStats) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">관리자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[150px]">
          <p className="font-bold text-slate-200 mb-3 border-b border-white/10 pb-2 text-xs">
             {payload[0].payload.fullDate} ({payload[0].payload.day})
          </p>
          <div className="space-y-2">
            {[
                { label: '방문자', value: payload.find((p:any) => p.dataKey === 'visits')?.value, color: '#60a5fa' },
                { label: '신규 가입', value: payload.find((p:any) => p.dataKey === 'users')?.value, color: '#f472b6' },
                { label: '프로젝트', value: payload.find((p:any) => p.dataKey === 'projects')?.value, color: '#818cf8' },
            ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 text-xs">
                    <span className="font-medium text-slate-400">{item.label}</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.value?.toLocaleString() || 0}</span>
                </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            반가워요, <span className="text-[#16A34A]">관리자님!</span> 👋
          </h1>
          <p className="text-slate-500 mt-2 font-medium">오늘의 제 평가는요? 현황을 요약해 드립니다.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             <span className="text-sm font-bold text-slate-600">시스템 정상 작동 중</span>
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "오늘 방문자수", value: stats.todayVisits, icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "전체 회원수", value: stats.totalUsers, icon: Users, color: "text-pink-600", bg: "bg-pink-50" },
          { label: "프로젝트 등록수", value: stats.totalProjects, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "채용/공모 등록수", value: stats.totalRecruitItems, icon: Briefcase, color: "text-green-600", bg: "bg-green-50" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow duration-300 rounded-[24px] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${item.bg} ${item.color} p-3 rounded-2xl`}>
                  <item.icon size={22} />
                </div>
                <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none bg-slate-50 px-2 py-1 rounded">Total</div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-tight">{item.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-slate-900">{item.value.toLocaleString()}</p>
                  {i === 0 && (
                    <span className={`text-[10px] font-bold ${stats.projectGrowth >= 0 ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-1 rounded`}>
                      {stats.projectGrowth >= 0 ? `+${stats.projectGrowth}%` : `${stats.projectGrowth}%`}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Width Chart Section */}
      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden p-8 flex flex-col justify-between min-h-[500px] bg-white">
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <BarChart3 className="text-[#16A34A]" />
                    플랫폼 통계
                  </CardTitle>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
                       <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-blue-500"></div> 방문자</div>
                       <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div> 가입</div>
                       <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div> 프로젝트</div>
                  </div>
              </div>
              <select 
                value={statsRange} 
                onChange={(e) => setStatsRange(Number(e.target.value))}
                className="bg-slate-50 border-none text-[10px] font-bold text-slate-500 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer"
              >
                <option value={7}>최근 7일</option>
                <option value={30}>최근 30일</option>
              </select>
            </div>
            
            {/* Recharts Implementation */}
            <div className="w-full h-[350px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  
                  <Area 
                    type="monotone" 
                    dataKey="visits" 
                    name="방문자" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorVisits)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    name="신규 가입" 
                    stroke="#ec4899" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="projects" 
                    name="프로젝트" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 italic">
              플랫폼 활성도가 전주 대비 <span className={`font-bold ${stats.projectGrowth >= 0 ? 'text-[#16A34A]' : 'text-red-600'}`}>
                {Math.abs(stats.projectGrowth)}% {stats.projectGrowth >= 0 ? '개선' : '정체'}
              </span>되었습니다.
            </p>
            <Button variant="ghost" className="text-[#16A34A] font-bold text-xs hover:bg-[#16A34A]/5 rounded-xl" onClick={() => router.push('/admin/stats')}>상세 리포트 보기</Button>
          </div>
      </Card>

      {/* Recent Activities Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Projects */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden p-6 flex flex-col bg-white min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
                <CardTitle className="text-lg font-black italic flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full inline-block"></span>
                    최근 프로젝트
                </CardTitle>
                <Link href="/admin/projects" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">더보기</Link>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {recentProjects.length > 0 ? recentProjects.map((project, idx) => (
                    <div key={idx} className="flex items-center gap-4 group cursor-pointer hover:bg-indigo-50/50 p-2.5 rounded-xl transition-all border border-transparent hover:border-indigo-100">
                        <div className="w-14 h-14 rounded-xl bg-slate-100 bg-cover bg-center flex-shrink-0 border border-slate-100 shadow-sm" style={{ backgroundImage: `url(${project.thumbnail_url || '/globe.svg'})` }} />
                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{project.title || "제목 없음"}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">@{project.profiles?.username || "익명"}</span>
                                <span className="text-[11px] text-slate-400">{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <FileText size={32} strokeWidth={1.5} />
                        <span className="text-xs">등록된 프로젝트가 없습니다.</span>
                    </div>
                )}
            </div>
          </Card>

          {/* Inquiries */}
          <Card className="border-none shadow-sm rounded-[32px] overflow-hidden p-6 flex flex-col bg-white min-h-[400px]">
             <div className="flex items-center justify-between mb-6">
                <CardTitle className="text-lg font-black italic flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full inline-block"></span>
                    최근 문의
                </CardTitle>
                <Link href="/admin/inquiries" className="text-slate-400 hover:text-orange-600 text-xs font-bold transition-colors">더보기</Link>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {recentInquiries.length > 0 ? recentInquiries.map((inq, idx) => (
                    <div key={idx} className="flex items-start gap-3 group cursor-pointer hover:bg-orange-50/50 p-3 rounded-xl transition-all border border-transparent hover:border-orange-100">
                      <div className="mt-1 w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 shadow-sm group-hover:bg-orange-100 transition-colors">
                        <MessageCircle size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-slate-900 text-sm truncate">{inq.title || "문의"}</p>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${inq.status === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                            {inq.status === 'resolved' ? '완료' : '대기'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{inq.content || "내용 없음"}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block font-medium">{new Date(inq.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <MessageCircle size={32} strokeWidth={1.5} />
                        <span className="text-xs">새로운 문의가 없습니다.</span>
                    </div>
                )}
            </div>
          </Card>
      </div>
    </div>
  );
}
