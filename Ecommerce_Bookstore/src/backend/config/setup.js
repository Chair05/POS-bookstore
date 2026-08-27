import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  console.log('Connected to MySQL. Setting up database...');

  const dbName = process.env.DB_NAME || 'lccb_bookstore';

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);

  const [existingTables] = await connection.query("SHOW TABLES LIKE 'customers'");
  if (existingTables.length > 0) {
    console.log('Existing "customers" table detected — adding missing columns only...');

    const [columns] = await connection.query("SHOW COLUMNS FROM customers");
    const colNames = columns.map(c => c.Field);

    if (!colNames.includes('role')) {
      await connection.query("ALTER TABLE customers ADD COLUMN role VARCHAR(20) DEFAULT 'customer' AFTER password");
      console.log('  + Added "role" column');
    }
    if (!colNames.includes('contact_number')) {
      await connection.query("ALTER TABLE customers ADD COLUMN contact_number VARCHAR(20) AFTER email");
      console.log('  + Added "contact_number" column');
    }

    console.log('  Customers table ready.');
  } else {
    console.log('No existing "customers" table — creating...');
    await connection.query(`
      CREATE TABLE customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        contact_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100),
      image VARCHAR(500),
      stock INT DEFAULT 0,
      sizes JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [productColumns] = await connection.query('SHOW COLUMNS FROM products');
  const productColumnNames = productColumns.map((column) => column.Field);

  if (!productColumnNames.includes('description')) {
    await connection.query('ALTER TABLE products ADD COLUMN description TEXT AFTER name');
    console.log('  + Added "description" column to products');
  }
  if (!productColumnNames.includes('sizes')) {
    await connection.query('ALTER TABLE products ADD COLUMN sizes JSON AFTER stock');
    console.log('  + Added "sizes" column to products');
  }
  if (!productColumnNames.includes('created_at')) {
    await connection.query('ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER sizes');
    console.log('  + Added "created_at" column to products');
  }
  if (!productColumnNames.includes('updated_at')) {
    await connection.query('ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
    console.log('  + Added "updated_at" column to products');
  }

  if (!productColumnNames.includes('product_group_id')) {
    await connection.query('ALTER TABLE products ADD COLUMN product_group_id INT NULL AFTER sizes');
    console.log('  + Added "product_group_id" column to products');
  }
  if (!productColumnNames.includes('variant_size')) {
    await connection.query('ALTER TABLE products ADD COLUMN variant_size VARCHAR(50) NULL AFTER product_group_id');
    console.log('  + Added "variant_size" column to products');
  }
  if (!productColumnNames.includes('barcode')) {
    await connection.query('ALTER TABLE products ADD COLUMN barcode VARCHAR(100) NULL AFTER stock');
    console.log('  + Added "barcode" column to products');
  }
  if (!productColumnNames.includes('cost_price')) {
    await connection.query('ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0 AFTER size');
    console.log('  + Added "cost_price" column to products');
  }
  if (!productColumnNames.includes('department')) {
    await connection.query("ALTER TABLE products ADD COLUMN department VARCHAR(100) DEFAULT '' AFTER cost_price");
    console.log('  + Added "department" column to products');
  }

  const [orderColumns] = await connection.query('SHOW COLUMNS FROM orders');
  const orderColumnNames = orderColumns.map((column) => column.Field);
  if (!orderColumnNames.includes('reference_number')) {
    await connection.query("ALTER TABLE orders ADD COLUMN reference_number VARCHAR(255) AFTER customer_contact");
    console.log('  + Added "reference_number" column to orders');
  }
  if (!orderColumnNames.includes('payment_method')) {
    await connection.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) AFTER reference_number");
    console.log('  + Added "payment_method" column to orders');
  }
  if (!orderColumnNames.includes('receipt_image')) {
    await connection.query("ALTER TABLE orders ADD COLUMN receipt_image VARCHAR(500) AFTER payment_method");
    console.log('  + Added "receipt_image" column to orders');
  }
  if (!orderColumnNames.includes('payment_status')) {
    await connection.query("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' AFTER receipt_image");
    console.log('  + Added "payment_status" column to orders');
  }
  if (!orderColumnNames.includes('pickup_code')) {
    const afterCol = orderColumnNames.includes('payment_status') ? 'payment_status' : 'receipt_image';
    await connection.query(`ALTER TABLE orders ADD COLUMN pickup_code VARCHAR(10) AFTER ${afterCol}`);
    console.log('  + Added "pickup_code" column to orders');
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_customer_cart (customer_id)
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cart_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT DEFAULT 1,
      selected_size VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending Payment Verification',
      customer_full_name VARCHAR(255),
      customer_email VARCHAR(255),
      customer_contact VARCHAR(20),
      reference_number VARCHAR(255),
      payment_method VARCHAR(50),
      receipt_image VARCHAR(500),
      payment_status VARCHAR(20) DEFAULT 'pending',
      pickup_code VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      selected_size VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      customer_id INT NOT NULL,
      receipt_image VARCHAR(500),
      reference_number VARCHAR(255),
      payment_method VARCHAR(50),
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      verified_by INT,
      verified_at TIMESTAMP NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      receipt_id INT NULL,
      product_id INT NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      type ENUM('IN','OUT') NOT NULL,
      quantity INT NOT NULL,
      reason VARCHAR(255) DEFAULT '',
      staff VARCHAR(100) DEFAULT 'System',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_code VARCHAR(6) NOT NULL,
      purpose ENUM('login', 'register') NOT NULL,
      expires_at DATETIME NOT NULL,
      used TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email_purpose (email, purpose)
    )
  `);

  const [existingAdmin] = await connection.query(
    'SELECT id FROM customers WHERE email = ?',
    ['admin@lccb.edu.ph']
  );

  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      'INSERT INTO customers (full_name, email, contact_number, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin@lccb.edu.ph', '09000000000', hashedPassword, 'admin']
    );
    console.log('Default admin account created: admin@lccb.edu.ph / admin123');
  }

  console.log('Database setup complete!');
  await connection.end();
}

setup().catch((err) => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
