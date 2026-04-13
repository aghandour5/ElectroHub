const pool = require('../../config/db');
pool.query("UPDATE users SET role = 'admin' WHERE email = 'popq1258@gmail.com'")
  .then(res => { 
    console.log('User promoted to admin!'); 
    process.exit(0); 
  })
  .catch(e => { 
    console.error(e); 
    process.exit(1); 
  });
