
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findWayo() {
  const { data, error } = await supabase
    .from('Project')
    .select('project_id, title, content_text, custom_data')
    .ilike('content_text', '%wayo.co.kr%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Found ${data.length} projects with wayo.co.kr in content_text`);
    data.forEach(p => {
        console.log(`- ID: ${p.project_id}, Title: ${p.title}`);
    });
  } else {
    console.log('No projects found with wayo.co.kr in content_text');
  }
}

findWayo();
