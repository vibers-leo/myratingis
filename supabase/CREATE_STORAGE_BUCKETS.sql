-- Supabase Storage 버킷 생성 SQL
-- Supabase SQL Editor에서 실행

-- 1. profiles 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- 2. projects 버킷 확인/생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('projects', 'projects', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 버킷 정책 설정 (모든 사용자가 읽기 가능)
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'projects');

-- 4. 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'projects' AND 
  auth.role() = 'authenticated'
);

-- 5. 본인 파일만 삭제 가능
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'projects' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
