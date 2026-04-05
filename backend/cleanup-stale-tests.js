const mysql = require('mysql2/promise');

const TEST_TARGET_SECONDS = 360;
const MIN_VALID_READINGS = 30;
const STALE_MINUTES = 10;

async function cleanupStaleTests() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cesar',
    password: process.env.DB_PASSWORD || 'cesar123',
    database: process.env.DB_NAME || 'pau',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  });

  try {
    const [rows] = await connection.execute(
      `SELECT id, estado, duracion, createdAt
       FROM tests
       WHERE estado = 'en_progreso'
         AND TIMESTAMPDIFF(MINUTE, createdAt, NOW()) >= ?`,
      [STALE_MINUTES]
    );

    if (!rows.length) {
      console.log('No hay tests en_progreso atascados para limpiar.');
      return;
    }

    let completed = 0;
    let canceled = 0;

    for (const test of rows) {
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as total FROM test_readings WHERE testId = ?',
        [test.id]
      );

      const readingsCount = Number(countRows[0].total || 0);
      const duration = Number(test.duracion || 0);

      const finalStatus =
        duration >= TEST_TARGET_SECONDS || readingsCount >= MIN_VALID_READINGS
          ? 'completada'
          : 'cancelada';

      await connection.execute(
        `UPDATE tests
         SET estado = ?,
             observaciones = CONCAT(COALESCE(observaciones, ''),
               CASE WHEN COALESCE(observaciones, '') = '' THEN '' ELSE ' | ' END,
               ?)
         WHERE id = ?`,
        [
          finalStatus,
          `Auto-cleanup ${new Date().toISOString()} (readings=${readingsCount}, duracion=${duration}s)`,
          test.id,
        ]
      );

      if (finalStatus === 'completada') completed += 1;
      else canceled += 1;

      console.log(`Test ${test.id} => ${finalStatus} (readings=${readingsCount}, duracion=${duration}s)`);
    }

    console.log('Resumen limpieza:');
    console.log(`- Completadas: ${completed}`);
    console.log(`- Canceladas: ${canceled}`);
  } finally {
    await connection.end();
  }
}

cleanupStaleTests().catch((error) => {
  console.error('Error ejecutando limpieza:', error);
  process.exit(1);
});
