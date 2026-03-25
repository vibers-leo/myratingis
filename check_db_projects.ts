
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  console.log('Checking database for latest projects...');
  const { data, error } = await supabase
    .from('Project')
    .select('project_id, title, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('\nLatest 5 Projects found:');
    data.forEach((p: any) => {
      console.log(`- [ID: ${p.project_id}] ${p.title} (User: ${p.user_id}) - Created at: ${p.created_at}`);
    });
  } else {
    console.log('No projects found in the database.');
  }
}

checkProjects();
