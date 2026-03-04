/**
 * Script para crear usuario admin@hotmail.com
 * Ejecutar con: node create-admin.js
 */

const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cesar',
    password: process.env.DB_PASSWORD || 'cesar123',
    database: process.env.DB_NAME || 'pau',
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  try {
    // Verificar si el usuario ya existe
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@hotmail.com']
    );

    if (rows.length > 0) {
      console.log('❌ El usuario admin@hotmail.com ya existe');
      connection.end();
      return;
    }

    // Crear usuario admin
    const hashedPassword = bcryptjs.hashSync('admin123', 10);
    const adminId = uuidv4();

    await connection.execute(
      'INSERT INTO users (id, nombre, email, password, rol, institucion) VALUES (?, ?, ?, ?, ?, ?)',
      [adminId, 'Admin User', 'admin@hotmail.com', hashedPassword, 'admin', 'Hospital Central']
    );

    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@hotmail.com');
    console.log('🔐 Contraseña: admin123');
    console.log('👤 ID: ' + adminId);
    
    connection.end();
  } catch (error) {
    console.error('❌ Error:', error);
    connection.end();
    process.exit(1);
  }
}

createAdmin();
