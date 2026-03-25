// scripts/crawl-recruit.js
// 채용·공모전·이벤트 자동 크롤링 스크립트

// 로컬 환경에서 .env.local 파일 읽기
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');

// 환경변수 확인
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다!');
  console.error('');
  console.error('.env.local 파일에 다음 환경변수를 추가하세요:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
  console.error('');
  process.exit(1);
}

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 크롤링할 사이트 목록
const CRAWL_SOURCES = {
  contests: [
    {
      name: 'Wevity',
      url: 'https://www.wevity.com',
      selector: '.list-item', // 실제 선택자로 변경 필요
    },
    {
      name: 'ThinkContest',
      url: 'https://www.thinkcontest.com',
      selector: '.contest-item',
    }
  ],
  jobs: [
    {
      name: 'Wanted',
      url: 'https://www.wanted.co.kr/wdlist/518', // 디자이너 채용
      selector: '.job-card',
    }
  ]
};

/**
 * 메인 크롤링 함수
 */
async function main() {
  console.log('🚀 Starting crawl at:', new Date().toISOString());
  
  try {
    const allItems = [];
    
    // 공모전 크롤링
    console.log('📋 Crawling contests...');
    for (const source of CRAWL_SOURCES.contests) {
      try {
        const items = await crawlContests(source);
        allItems.push(...items);
        console.log(`✅ ${source.name}: ${items.length} items`);
      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error.message);
      }
    }
    
    // 채용 크롤링
    console.log('💼 Crawling jobs...');
    for (const source of CRAWL_SOURCES.jobs) {
      try {
        const items = await crawlJobs(source);
        allItems.push(...items);
        console.log(`✅ ${source.name}: ${items.length} items`);
      } catch (error) {
        console.error(`❌ ${source.name} failed:`, error.message);
      }
    }
    
    // DB에 저장 (중복 체크)
    if (allItems.length > 0) {
      const savedCount = await saveToDatabase(allItems);
      console.log(`💾 Saved ${savedCount} new items to database`);
    } else {
      console.log('⚠️ No items crawled');
    }
    
    console.log('✨ Crawl completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

/**
 * 공모전 크롤링
 */
async function crawlContests(source) {
  const items = [];
  
  try {
    // 예시: 실제 사이트에 맞게 수정 필요
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // 예시 파싱 로직 (실제 사이트 구조에 맞게 수정)
    $(source.selector).each((i, element) => {
      try {
        const title = $(element).find('.title').text().trim();
        const description = $(element).find('.description').text().trim();
        const link = $(element).find('a').attr('href');
        const dateText = $(element).find('.date').text().trim();
        
        if (title && link) {
          items.push({
            title,
            description: description || '상세 내용은 링크를 참조하세요.',
            type: 'contest',
            date: parseDate(dateText),
            link: normalizeUrl(link, source.url),
            company: source.name,
            prize: extractPrize(description),
            location: '온라인',
            is_approved: false,
            is_active: false,
            crawled_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Item parsing error:', err.message);
      }
    });
    
  } catch (error) {
    console.error(`Crawl error for ${source.name}:`, error.message);
  }
  
  return items;
}

/**
 * 채용 크롤링
 */
async function crawlJobs(source) {
  const items = [];
  
  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    $(source.selector).each((i, element) => {
      try {
        const title = $(element).find('.job-title').text().trim();
        const company = $(element).find('.company-name').text().trim();
        const link = $(element).find('a').attr('href');
        const location = $(element).find('.location').text().trim();
        
        if (title && link) {
          items.push({
            title,
            description: `${company}에서 채용 중입니다.`,
            type: 'job',
            date: getDefaultDeadline(), // 30일 후
            link: normalizeUrl(link, source.url),
            company,
            location: location || '서울',
            employment_type: '정규직',
            is_approved: false,
            is_active: false,
            crawled_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Item parsing error:', err.message);
      }
    });
    
  } catch (error) {
    console.error(`Crawl error for ${source.name}:`, error.message);
  }
  
  return items;
}

/**
 * DB에 저장 (중복 체크)
 */
async function saveToDatabase(items) {
  let savedCount = 0;
  
  for (const item of items) {
    try {
      // 중복 체크 (제목 + 링크)
      const { data: existing } = await supabase
        .from('recruit_items')
        .select('id')
        .eq('title', item.title)
        .eq('link', item.link)
        .single();
      
      if (existing) {
        console.log(`⏭️ Skipping duplicate: ${item.title}`);
        continue;
      }
      
      // 새 항목 저장
      const { error } = await supabase
        .from('recruit_items')
        .insert([item]);
      
      if (error) {
        console.error(`❌ Save error for "${item.title}":`, error.message);
      } else {
        savedCount++;
      }
      
    } catch (err) {
      console.error('Save error:', err.message);
    }
  }
  
  return savedCount;
}

/**
 * 유틸리티 함수들
 */

// 날짜 파싱
function parseDate(dateText) {
  // 예: "2025.12.31" -> "2025-12-31"
  if (!dateText) return getDefaultDeadline();
  
  const cleaned = dateText.replace(/[^\d.-]/g, '');
  const parts = cleaned.split(/[.-]/);
  
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  
  return getDefaultDeadline();
}

// 기본 마감일 (30일 후)
function getDefaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

// URL 정규화
function normalizeUrl(url, baseUrl) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  const base = new URL(baseUrl);
  return `${base.protocol}//${base.host}${url.startsWith('/') ? '' : '/'}${url}`;
}

// 상금 추출
function extractPrize(text) {
  if (!text) return null;
  
  const prizeMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*만원|(\d+)\s*억/);
  if (prizeMatch) {
    return `총 상금 ${prizeMatch[0]}`;
  }
  
  return null;
}

// 실행
main();
