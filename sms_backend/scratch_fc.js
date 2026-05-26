require('dotenv').config();
const pool = require('./src/db/connection');
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.notifications (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        creator_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
        receiver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        message text NOT NULL,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT notifications_pkey PRIMARY KEY (id)
      );
    `);
    console.log('Table created.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
