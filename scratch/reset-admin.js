const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const pg = require('pg');
require('dotenv').config();

async function resetAdmin() {
  const adminEmail = 'admin@electrohub.com';
  const newPassword = 'Admin123!';

  console.log(`--- Resetting Admin: ${adminEmail} ---`);

  // 1. Initialize Supabase Admin
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // 2. Manage Supabase Auth User
  console.log('Checking Supabase Auth...');
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const authUser = users.find(u => u.email === adminEmail);

  if (authUser) {
    console.log('User exists in Auth. Updating password...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
      password: newPassword,
      email_confirm: true
    });
    if (updateError) throw updateError;
  } else {
    console.log('User NOT in Auth. Creating new Auth user...');
    const { error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: newPassword,
      email_confirm: true,
      user_metadata: { name: 'System Admin' }
    });
    if (createError) throw createError;
  }

  // 3. Update Local Database password_hash
  console.log('Updating local database hash...');
  const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  try {
    const res = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, role',
      [hashedPassword, adminEmail]
    );

    if (res.rowCount === 0) {
      console.log('Admin not found in users table! Creating row...');
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['System Admin', adminEmail, hashedPassword, 'admin']
      );
    } else {
      console.log('Local database updated successfully.');
    }
  } finally {
    await pool.end();
  }

  console.log('\n--- SUCCESS ---');
  console.log(`Email: ${adminEmail}`);
  console.log(`New Password: ${newPassword}`);
  console.log('You can now log in using the website form.');
}

resetAdmin().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
