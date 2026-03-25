
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUrls() {
  const { data, error } = await supabase
    .from('Project')
    .select('project_id, title, primary_url, url, preview_url, site_url, custom_data');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Project URL Audit:');
  data.forEach(p => {
    console.log(`- ID: ${p.project_id}, Title: ${p.title}`);
    console.log(`  primary_url: ${p.primary_url}`);
    console.log(`  url: ${p.url}`);
    console.log(`  preview_url: ${p.preview_url}`);
    console.log(`  site_url: ${p.site_url}`);
    console.log(`  audit_config.mediaA: ${p.custom_data?.audit_config?.mediaA}`);
  });
}

listAllUrls();
