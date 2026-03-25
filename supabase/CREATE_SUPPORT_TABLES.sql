-- Support Tables: FAQ, Notices

-- ============================================
-- 1. FAQs Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.faqs (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category VARCHAR(50) NOT NULL DEFAULT 'General', -- General, Account, Project, etc.
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INT DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public FAQs are viewable by everyone."
  ON public.faqs FOR SELECT
  USING (is_visible = true);

-- Admin can manage everything (simplify for now, allow all manipulation if admin)
-- (Adjust policy based on actual admin auth implementation)
CREATE POLICY "Admins can manage FAQs"
  ON public.faqs FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================
-- 2. Notices Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.notices (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Notices are viewable by everyone."
  ON public.notices FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage Notices"
  ON public.notices FOR ALL
  USING (true)
  WITH CHECK (true);


-- ============================================
-- 3. Initial Data (Seed)
-- ============================================

-- FAQ Seed
INSERT INTO public.faqs (category, question, answer, order_index) VALUES
('서비스 이용', '제 평가는요?는 무료로 이용할 수 있나요?', '네, 제 평가는요?의 기본 기능인 프로젝트 업로드, 평가 참여, 검색 기능은 모두 무료로 제공됩니다. 추후 프리미엄 기능이 추가될 수 있습니다.', 1),
('계정 관리', '회원가입은 어떻게 하나요?', '우측 상단의 "로그인" 버튼을 클릭한 후, "회원가입" 탭을 선택하여 이메일과 비밀번호를 입력하면 간편하게 가입할 수 있습니다.', 2),
('프로젝트', '프로젝트 업로드는 어떻게 하나요?', '로그인 후, 우측 상단의 프로필 메뉴에서 "프로젝트 업로드"를 클릭하거나 메인 페이지 하단의 "첫 프로젝트 등록하기" 버튼을 통해 프로젝트를 등록할 수 있습니다.', 3),
('프로젝트', '어떤 이미지 형식을 지원하나요?', '현재 JPG, PNG, WEBP, GIF 형식을 지원합니다. 최대 10MB 크기의 이미지를 업로드할 수 있습니다.', 4),
('서비스 이용', '관심사 설정은 왜 필요한가요?', '관심사를 설정하면 사용자 취향에 맞는 맞춤형 프로젝트를 추천해 드립니다. 마이페이지 > 설정에서 언제든지 변경할 수 있습니다.', 5),
('계정 관리', '비밀번호를 분실했어요.', '로그인 페이지의 "비밀번호 찾기" 링크를 통해 가입하신 이메일로 비밀번호 재설정 링크를 받을 수 있습니다.', 6),
('서비스 이용', '프로젝트를 북마크하거나 좋아요를 누를 수 있나요?', '네, 마음에 드는 프로젝트 상세 페이지에서 하트 아이콘을 눌러 "좋아요"를 표시하거나, 북마크 아이콘을 눌러 저장할 수 있습니다. 저장된 프로젝트는 마이페이지에서 확인 가능합니다.', 7),
('운영 정책', '저작권 정책은 어떻게 되나요?', '본 서비스에 업로드된 콘텐츠의 저작권은 해당 창작자에게 있으며, 타인의 저작권을 침해하는 콘텐츠는 예고 없이 삭제될 수 있습니다.', 8),
('서비스 이용', '모바일에서도 이용 가능한가요?', '네, 데스크탑뿐만 아니라 태블릿, 모바일 환경에서도 최적화된 화면으로 이용하실 수 있습니다.', 9),
('문의', '버그 제보나 개선 사항은 어디로 보내나요?', '하단 푸터의 "문의하기" 링크를 통해 버그 제보나 서비스 개선 아이디어를 보내주시면 적극 반영하겠습니다.', 10);

-- Notices Seed
INSERT INTO public.notices (title, content, is_important) VALUES
('🎉 제 평가는요? 서비스 오픈 안내', '안녕하세요, 제 평가는요? 팀입니다. 전문 평가위원과 참여고객의 날카로운 시선으로 프로젝트의 진짜 가치를 증명하는 플랫폼이 정식 오픈했습니다. 많은 관심과 이용 부탁드립니다.', true),
('🔧 시스템 점검 안내 (12/20)', '안정적인 서비스 제공을 위해 12월 20일 오전 3시부터 5시까지 시스템 점검이 진행될 예정입니다. 이용에 참고 부탁드립니다.', false);
