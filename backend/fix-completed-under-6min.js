const mysql = require('mysql2/promise');

const TEST_TARGET_SECONDS = 360;

async function fixCompletedUnder6Min() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cesar',
    password: process.env.DB_PASSWORD || 'cesar123',
    database: process.env.DB_NAME || 'pau',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  });

  try {
    const [rows] = await connection.execute(
      `SELECT t.id,
              t.duracion,
              t.observaciones,
              COALESCE(MAX(r.tiempo), 0) AS maxTiempo,
              COUNT(r.id) AS readingsCount
       FROM tests t
       LEFT JOIN test_readings r ON r.testId = t.id
       WHERE t.estado = 'completada'
       GROUP BY t.id, t.duracion, t.observaciones`
    );

    const inconsistent = rows.filter((row) => {
      const duration = Math.max(Number(row.duracion || 0), Number(row.maxTiempo || 0));
      return duration < TEST_TARGET_SECONDS;
    });

    if (inconsistent.length === 0) {
      console.log('No se encontraron tests completada con menos de 6 minutos.');
      return;
    }

    console.log(`Tests inconsistentes encontrados: ${inconsistent.length}`);

    let updated = 0;
    for (const test of inconsistent) {
      const duration = Math.max(Number(test.duracion || 0), Number(test.maxTiempo || 0));
      const baseObs = (test.observaciones || '').trim();
      const note = `Corregido por script ${new Date().toISOString()} (duracion=${duration}s, readings=${Number(
        test.readingsCount || 0
      )})`;

      const finalObs = baseObs
        ? baseObs.includes('Corregido por script')
          ? baseObs
          : `${baseObs} | ${note}`
        : note;

      await connection.execute(
        `UPDATE tests
         SET estado = 'cancelada',
             observaciones = ?
         WHERE id = ?`,
        [finalObs, test.id]
      );

      updated += 1;
      console.log(`Test ${test.id} -> cancelada (duracion=${duration}s)`);
    }

    console.log(`Total corregidos: ${updated}`);
  } finally {
    await connection.end();
  }
}

fixCompletedUnder6Min().catch((error) => {
  console.error('Error corrigiendo historial:', error);
  process.exit(1);
});
