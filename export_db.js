const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function exportDatabase() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // List of tables to export in order of dependency
    const tables = [
      'users', 
      'categories', 
      'products', 
      'orders', 
      'order_items', 
      'notifications', 
      'contact_messages', 
      'newsletter_subscriptions', 
      'coupon_codes', 
      'testimonials'
    ];
    
    let sql = `-- ElectroHub Database Export\n-- Generated on ${new Date().toLocaleString()}\n\n`;
    sql += `SET statement_timeout = 0;\nSET lock_timeout = 0;\nSET idle_in_transaction_session_timeout = 0;\nSET client_encoding = 'UTF8';\n\n`;

    for (const table of tables) {
      console.log(`Exporting ${table}...`);
      const result = await pool.query(`SELECT * FROM ${table}`);
      
      sql += `-- Table: ${table}\n`;
      if (result.rows.length === 0) {
        sql += `-- (No data found for ${table})\n\n`;
        continue;
      }

      for (const row of result.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          if (typeof val === 'object') {
            // Handle JSONB columns
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }
          return val;
        }).join(', ');
        
        sql += `INSERT INTO ${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
      }
      sql += '\n';
    }

    const fileName = 'electrohub_backup.sql';
    fs.writeFileSync(fileName, sql);
    console.log(`\n✅ Database exported successfully to ${fileName}`);
  } catch (err) {
    console.error('\n❌ Export failed:', err.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

exportDatabase();
