
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function patchProject() {
  const projectId = 1;
  const targetUrl = 'https://wayo.co.kr';

  console.log(`Patching Project ID ${projectId} to include URL: ${targetUrl}`);
  
  // 1. Fetch existing data
  const { data: project } = await supabase
    .from('Project')
    .select('custom_data')
    .eq('project_id', projectId)
    .single();

  if (!project) return console.log('Project not found');

  // 2. Update custom_data
  const customData = project.custom_data || {};
  if (!customData.audit_config) customData.audit_config = {};
  customData.audit_config.mediaA = targetUrl;

  const { error } = await supabase
    .from('Project')
    .update({ 
        custom_data: customData,
        description: '와요 서비스 진단 요청입니다.' // Adding some desc if missing
    })
    .eq('project_id', projectId);

  if (error) {
    console.error('Error patching:', error);
  } else {
    console.log('Successfully patched project with URL!');
  }
}

patchProject();
