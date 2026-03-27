// src/lib/storage.ts — 스토리지 추상화 레이어
// Supabase Storage 제거 후 로컬 파일 업로드 또는 외부 서비스 사용

/**
 * 이미지 업로드 — 현재는 Data URL 또는 외부 URL 사용
 * 향후 S3, Cloudflare R2 등으로 전환 가능
 */
export async function uploadImage(
  file: File,
  bucket: string = 'projects'
): Promise<string> {
  // Base64 Data URL로 변환 (임시 방안)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function deleteImage(imageUrl: string): Promise<void> {
  // Data URL이면 삭제할 필요 없음
  console.log('[Storage] deleteImage (no-op):', imageUrl.substring(0, 50));
}

export function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new File([u8arr], filename, { type: mime });
}

export async function uploadImageFromUrl(url: string): Promise<string> {
  // 외부 URL은 그대로 반환
  return url;
}

export async function uploadFile(
  file: File,
  bucket: string = 'files'
): Promise<{ url: string; name: string; size: number; type: string }> {
  const url = await uploadImage(file, bucket);
  return { url, name: file.name, size: file.size, type: file.type };
}
