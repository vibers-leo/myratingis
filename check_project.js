
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProject() {
  const projectId = 3;
  console.log(`Checking project_id: ${projectId}`);
  const { data, error } = await supabase
    .from('Project')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return;
  }

  console.log('Project title:', data.title);
  console.log('Custom Data Categories:', JSON.stringify(data.custom_data?.audit_config?.categories || data.custom_data?.custom_categories, null, 2));
}

checkProject();
