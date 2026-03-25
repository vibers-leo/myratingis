const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { return; }

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Check profiles columns
  const pf = await supabase.from('profiles').select('*').limit(1);
  console.log('Profile Sample:', pf.data?.[0]);
  
  // Check auth users (only works with service role key)
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (users && users.length > 0) {
      console.log('Auth User Sample:', { email: users[0].email, id: users[0].id });
  } else {
      console.log('Could not fetch auth users:', error);
  }
}

check();
