require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data, error } = await supabase.storage.createBucket('student-documents', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
  });
  if (error) console.error('Error:', error.message);
  else console.log('Bucket created successfully:', data);
})();
