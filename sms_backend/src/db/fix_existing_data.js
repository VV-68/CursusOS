require('dotenv').config({ path: '.env' });
const pool = require('./connection');

async function fixExistingData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if there's any data needing a fix
    const usersNeedFix = await client.query('SELECT count(*) FROM users WHERE institution_id IS NULL');
    const deptsNeedFix = await client.query('SELECT count(*) FROM departments WHERE institution_id IS NULL');
    
    if (parseInt(usersNeedFix.rows[0].count) === 0 && parseInt(deptsNeedFix.rows[0].count) === 0) {
      console.log('No existing data needs to be fixed. Everything has an institution_id.');
      await client.query('ROLLBACK');
      return;
    }

    // 1. Create a default institution
    const instRes = await client.query(`
      INSERT INTO institutions (name, location) 
      VALUES ('Default College', 'Main Campus') 
      RETURNING id
    `);
    const defaultInstitutionId = instRes.rows[0].id;
    
    // 2. Update existing departments
    const updatedDepts = await client.query(`
      UPDATE departments 
      SET institution_id = $1 
      WHERE institution_id IS NULL
    `, [defaultInstitutionId]);
    
    // 3. Update existing users
    const updatedUsers = await client.query(`
      UPDATE users 
      SET institution_id = $1 
      WHERE institution_id IS NULL
    `, [defaultInstitutionId]);

    await client.query('COMMIT');
    console.log(`Successfully migrated existing data.`);
    console.log(`- Created Default Institution ID: ${defaultInstitutionId}`);
    console.log(`- Updated ${updatedDepts.rowCount} departments.`);
    console.log(`- Updated ${updatedUsers.rowCount} users.`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing existing data:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixExistingData();
