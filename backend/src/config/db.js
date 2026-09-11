import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const dbConfig = {
  host: process.env.TIDB_HOST || 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port: parseInt(process.env.TIDB_PORT || '4000', 10),
  user: process.env.TIDB_USER || '4SdUDroc3aRrqF9.root',
  password: process.env.TIDB_PASSWORD || '45j40tZfeQb8C9xB',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
}

const dbName = process.env.TIDB_DATABASE || 'simcha_billing'

let pool = null

export async function initDatabase() {
  try {
    console.log('🔄 Connecting to TiDB Cloud Serverless...')
    
    // Step 1: Connect to server to ensure database exists
    const initConnection = await mysql.createConnection(dbConfig)
    await initConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`)
    await initConnection.end()
    console.log(`✅ Database "${dbName}" verified / created successfully.`)

    // Step 2: Initialize connection pool with the database
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    })


    // Step 3: Create Users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'Administrator',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    console.log('✅ "users" table ready.')

    // Step 4: Seed default Admin user if not exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@simcha.com'])
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10)
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Rishi', 'admin@simcha.com', hashedPassword, 'Administrator']
      )
      console.log('✨ Seeded default Admin user: admin@simcha.com / admin123')
    }

    // Step 5: Create Categories table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    console.log('✅ "categories" table ready.')

    // Step 6: Seed initial categories if empty
    const [catCount] = await pool.query('SELECT COUNT(*) as count FROM categories')
    if (catCount[0].count === 0) {
      await pool.query(`
        INSERT INTO categories (name, status) VALUES 
        ('Raw Materials', 'Active'),
        ('Textiles & Fabrics', 'Active'),
        ('Packaging Goods', 'Active'),
        ('Hardware & Tools', 'Inactive')
      `)
      console.log('✨ Seeded sample categories.')
    }

    // Step 7: Create Materials table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(100),
        category_id INT,
        brand VARCHAR(100),
        unit VARCHAR(50) DEFAULT 'Nos',
        description TEXT,
        selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        mrp DECIMAL(12, 2) DEFAULT 0.00,
        hsn_code VARCHAR(50),
        tax_inclusive BOOLEAN DEFAULT FALSE,
        opening_stock INT DEFAULT 0,
        reorder_level INT DEFAULT 0,
        barcode VARCHAR(100),
        warranty VARCHAR(100),
        serial_tracking BOOLEAN DEFAULT FALSE,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    console.log('✅ "materials" table ready.')

    // Step 8: Seed initial materials if empty
    const [matCount] = await pool.query('SELECT COUNT(*) as count FROM materials')
    if (matCount[0].count === 0) {
      await pool.query(`
        INSERT INTO materials (name, code, category_id, brand, unit, description, selling_price, mrp, hsn_code, tax_inclusive, opening_stock, reorder_level, barcode, warranty, serial_tracking, status) VALUES 
        ('Cotton Fabric Rolls 100m', 'MAT-CTN-01', 2, 'Simcha Textiles', 'Meter', '100% Pure Cotton fabric for apparel', 450.00, 520.00, '5208', true, 120, 20, '8901234567890', 'No Warranty', false, 'Active'),
        ('Heavy Duty Cardboard Box (Large)', 'MAT-PKG-02', 3, 'PackPro', 'Box', 'Corrugated heavy grade carton packaging', 85.00, 110.00, '4819', false, 500, 50, '8909876543210', 'No Warranty', false, 'Active'),
        ('Stainless Steel Screws 100pcs Pack', 'MAT-HDW-03', 4, 'Apex Hardware', 'Nos', 'Grade 304 anti-rust screws', 280.00, 350.00, '7318', true, 80, 15, '8904567891234', '6 Months', false, 'Active')
      `)
      console.log('✨ Seeded sample materials.')
    }

    return pool
  } catch (error) {
    console.error('❌ Failed to initialize TiDB database:', error)
    throw error
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.')
  }
  return pool
}
