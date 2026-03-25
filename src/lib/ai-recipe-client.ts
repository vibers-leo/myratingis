/**
 * AI Recipe Image API Client
 * Stock Image + AI Image Generation
 */

const API_URL = process.env.IMAGE_API_URL || 'http://localhost:3300';
const API_KEY = process.env.IMAGE_API_KEY;

interface StockImageOptions {
  orientation?: 'landscape' | 'portrait' | 'squarish';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  page?: number;
  perPage?: number;
}

interface GenerateImageOptions {
  size?: 'small' | 'medium' | 'large';
  provider?: 'gemini' | 'pollinations' | 'auto';
}

export interface StockImageResult {
  url: string;
  provider: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
  thumbnailUrl: string;
}

export interface GenerateImageResult {
  url: string;
  prompt: string;
  provider: string;
}

/**
 * Stock Image 검색 (Unsplash → Pexels → Pixabay)
 */
export async function searchStockImage(
  query: string,
  options: StockImageOptions = {}
): Promise<StockImageResult> {
  if (!API_KEY) {
    throw new Error('IMAGE_API_KEY is not configured in environment variables');
  }

  const params = new URLSearchParams({
    q: query,
    ...(options as any)
  });

  const response = await fetch(`${API_URL}/api/v1/images/stock?${params}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Stock image search failed');
  }

  const result = await response.json();
  return result.data;
}

/**
 * AI 이미지 생성 (Gemini → Pollinations)
 */
export async function generateAIImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<GenerateImageResult> {
  if (!API_KEY) {
    throw new Error('IMAGE_API_KEY is not configured in environment variables');
  }

  const response = await fetch(`${API_URL}/api/v1/images/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, ...options }),
  });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 429) {
      throw new Error(`Rate limit exceeded: ${error.limit} requests/day`);
    }

    throw new Error(error.error || 'Image generation failed');
  }

  const result = await response.json();
  return result.data;
}
