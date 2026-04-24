const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const BUCKET_NAME = 'product-images';
const IMAGES_DIR = path.join(__dirname, '../../public/images');

async function setupStorage() {
  try {
    console.log(`Checking if bucket "${BUCKET_NAME}" exists...`);
    
    // 1. Create Bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    if (!buckets.find(b => b.id === BUCKET_NAME)) {
      console.log(`Creating public bucket "${BUCKET_NAME}"...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (createError) throw createError;
      console.log('Bucket created successfully.');
    } else {
      console.log('Bucket already exists.');
    }

    // 2. Upload Images
    const files = fs.readdirSync(IMAGES_DIR);
    console.log(`Found ${files.length} images to upload.`);

    for (const file of files) {
      const filePath = path.join(IMAGES_DIR, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = file.endsWith('.png') ? 'image/png' : 
                       file.endsWith('.jpg') || file.endsWith('.jpeg') ? 'image/jpeg' :
                       file.endsWith('.webp') ? 'image/webp' : 
                       file.endsWith('.avif') ? 'image/avif' : 'application/octet-stream';

      console.log(`Uploading ${file}...`);
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(file, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

      if (uploadError) {
        console.warn(`Failed to upload ${file}: ${uploadError.message}`);
      }
    }

    // 3. Update Database with Public URLs
    console.log('Updating database product image paths...');
    const { rows: products } = await pool.query('SELECT id, image_path FROM products');
    
    for (const product of products) {
      // Check if image_path is just a filename (doesn't start with http)
      if (product.image_path && !product.image_path.startsWith('http')) {
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${product.image_path}`;
        
        await pool.query('UPDATE products SET image_path = $1 WHERE id = $2', [publicUrl, product.id]);
        console.log(`Updated Product ${product.id} -> ${publicUrl}`);
      }
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupStorage();
