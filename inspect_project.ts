
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProject() {
  console.log('Inspecting Project ID 1...');
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .eq('project_id', 1)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return;
  }

  if (data) {
    console.log('\nProject Details:');
    console.log(`- Title: ${data.title}`);
    console.log(`- User: ${data.user_id}`);
    console.log(`- Summary: ${data.summary}`);
    console.log(`- Rendering Type: ${data.rendering_type}`);
    console.log(`- URL Candidates (Primary): ${data.primary_url}`);
    console.log(`- Content Length: ${data.content_text?.length || 0}`);
    console.log(`- Custom Data (Audit Config):`, JSON.stringify(data.custom_data, null, 2));
  } else {
    console.log('Project ID 1 not found.');
  }
}

inspectProject();
