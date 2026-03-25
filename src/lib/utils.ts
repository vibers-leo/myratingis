import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function linkify(text: string) {
  if (!text) return "";
  // 1. URL을 링크로 변환
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let linkedText = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline break-all">${url}</a>`;
  });
  // 2. 줄바꿈을 <br />로 변환
  return linkedText.replace(/\n/g, '<br />');
}
