
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllActually() {
  // Check both tables and all rows
  const { data, error } = await supabase
    .from('Project')
    .select('project_id, title, user_id, deleted_at, visibility');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total projects in DB: ${data?.length || 0}`);
  data?.forEach(p => {
    console.log(`- [ID: ${p.project_id}] "${p.title}" (User: ${p.user_id}) - Deleted: ${p.deleted_at}, Visibility: ${p.visibility}`);
  });
}

listAllActually();
