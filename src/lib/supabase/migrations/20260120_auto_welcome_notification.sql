
-- Function to handle new user registration and send welcome notifications
CREATE OR REPLACE FUNCTION public.handle_new_user_welcome()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. 환영 메시지
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
        NEW.id,
        'system',
        '제 평가는요?에 오신 것을 환영합니다! 🎉',
        '나만의 포트폴리오를 만들고 전 세계 크리에이터들과 소통해보세요.',
        '/mypage/profile',
        false
    );

    -- 2. 첫 게시물 등록 독려
    INSERT INTO public.notifications (user_id, type, title, message, link, read)
    VALUES (
        NEW.id,
        'system',
        '첫 게시물을 등록해보세요! 🚀',
        '멋진 작업물을 공유하고 피드백을 받아보세요.',
        '/project/upload',
        false
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition (auth.users 테이블에 트리거 설정)
-- Note: auth 스키마에 대한 권한이 필요할 수 있습니다. 
-- Supabase 대시보드 SQL 에디터에서 실행하는 것이 가장 좋습니다.
DROP TRIGGER IF EXISTS on_auth_user_created_welcome ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_welcome();
