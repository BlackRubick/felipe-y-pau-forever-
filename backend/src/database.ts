import mysql from 'mysql2/promise';
import bcryptjs from 'bcryptjs';
import { User, Test, TestReading, Alert } from './types';

let pool: mysql.Pool;

export async function initializeDatabase() {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cesar',
    password: process.env.DB_PASSWORD || 'cesar123',
    database: process.env.DB_NAME || 'pau',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await createTables();
  await initializeDefaultUsers();
}

async function createTables() {
  const connection = await pool.getConnection();

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) NOT NULL,
        institucion VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tests (
        id VARCHAR(36) PRIMARY KEY,
        paciente_id VARCHAR(36),
        paciente_nombreCompleto VARCHAR(255),
        paciente_edad INT,
        paciente_altura INT,
        paciente_peso DECIMAL(5,2),
        paciente_sexo VARCHAR(10),
        paciente_raza VARCHAR(100),
        medicoResponsable VARCHAR(255),
        fecha DATE,
        numeroCaminata INT,
        fechaCaminata DATE,
        enfermedadPulmonar VARCHAR(100),
        presionSanguineaInicial VARCHAR(20),
        oxigenoSupplementario BOOLEAN,
        estado VARCHAR(50),
        duracion INT,
        distanciaTotal INT,
        fcPromedio INT,
        spo2Promedio INT,
        observaciones TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_medico (medicoResponsable),
        INDEX idx_estado (estado),
        INDEX idx_fecha (fecha)
      )
    `);


    await connection.execute(`
      CREATE TABLE IF NOT EXISTS test_readings (
        id VARCHAR(36) PRIMARY KEY,
        testId VARCHAR(36) NOT NULL,
        tiempo INT,
        frecuenciaCardiaca INT,
        spo2 INT,
        pasos INT,
        distancia INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE,
        INDEX idx_test (testId)
      )
    `);


    await connection.execute(`
      CREATE TABLE IF NOT EXISTS alerts (
        id VARCHAR(36) PRIMARY KEY,
        testId VARCHAR(36) NOT NULL,
        tipo VARCHAR(100),
        mensaje VARCHAR(255),
        severidad VARCHAR(20),
        valor INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE,
        INDEX idx_test (testId),
        INDEX idx_severidad (severidad)
      )
    `);

    console.log('✅ Tablas de base de datos creadas/verificadas');
  } finally {
    connection.release();
  }
}

async function initializeDefaultUsers() {
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    if ((users as any)[0].count === 0) {
      const defaultUsers = [
        {
          id: 'user-1',
          nombre: 'Dr. Juan García',
          email: 'juan@hospital.com',
          password: bcryptjs.hashSync('Password123!', 10),
          rol: 'medico',
          institucion: 'Hospital Central',
        },
        {
          id: 'user-2',
          nombre: 'Dra. María López',
          email: 'maria@hospital.com',
          password: bcryptjs.hashSync('Password123!', 10),
          rol: 'medico',
          institucion: 'Hospital Central',
        },
        {
          id: 'user-3',
          nombre: 'Admin User',
          email: 'admin@hospital.com',
          password: bcryptjs.hashSync('Admin123!', 10),
          rol: 'admin',
          institucion: 'Hospital Central',
        },
      ];

      for (const user of defaultUsers) {
        await connection.execute(
          'INSERT INTO users (id, nombre, email, password, rol, institucion) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.nombre, user.email, user.password, user.rol, user.institucion]
        );
      }

      console.log('✅ Usuarios por defecto creados');
    }
  } finally {
    connection.release();
  }
}

export class Database {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0] ? this.mapRowToUser(rows[0]) : undefined;
    } finally {
      connection.release();
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return rows[0] ? this.mapRowToUser(rows[0]) : undefined;
    } finally {
      connection.release();
    }
  }

  async createUser(user: User): Promise<User> {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'INSERT INTO users (id, nombre, email, password, rol, institucion) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.nombre, user.email, user.password, user.rol, user.institucion] as any
      );
      return user;
    } finally {
      connection.release();
    }
  }

  async getAllUsers(): Promise<User[]> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute('SELECT * FROM users') as any;
      return rows.map((row: any) => this.mapRowToUser(row));
    } finally {
      connection.release();
    }
  }

  async createTest(test: Test): Promise<Test> {
    const connection = await pool.getConnection();
    try {
      const safe = <T>(value: T | undefined | null) => (value === undefined ? null : value);

      const query = `INSERT INTO tests (
          id, paciente_id, paciente_nombreCompleto, paciente_edad, paciente_altura,
          paciente_peso, paciente_sexo, paciente_raza, medicoResponsable, fecha,
          numeroCaminata, fechaCaminata, enfermedadPulmonar, presionSanguineaInicial,
          oxigenoSupplementario, estado, duracion, distanciaTotal, fcPromedio,
          spo2Promedio, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      await connection.execute(query as any, [
        test.id,
        safe(test.paciente.id),
        safe(test.paciente.nombreCompleto),
        safe(test.paciente.edad),
        safe(test.paciente.altura),
        safe(test.paciente.peso),
        safe(test.paciente.sexo),
        safe(test.paciente.raza),
        safe(test.medicoResponsable),
        safe(test.fecha),
        safe(test.numeroCaminata),
        safe(test.fechaCaminata),
        safe(test.enfermedadPulmonar),
        safe(test.presionSanguineaInicial),
        safe(test.oxigenoSupplementario),
        safe(test.estado),
        safe(test.duracion),
        safe(test.distanciaTotal),
        safe(test.fcPromedio),
        safe(test.spo2Promedio),
        safe(test.observaciones),
      ] as any);
      return test;
    } finally {
      connection.release();
    }
  }

  async getTestById(id: string): Promise<Test | undefined> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT * FROM tests WHERE id = ?',
        [id]
      );
      
      if (!rows[0]) return undefined;

      const test = this.mapRowToTest(rows[0]);

      const [readings]: any = await connection.execute(
        'SELECT * FROM test_readings WHERE testId = ? ORDER BY tiempo ASC',
        [id]
      );

      const [alerts]: any = await connection.execute(
        'SELECT * FROM alerts WHERE testId = ? ORDER BY timestamp DESC',
        [id]
      );

      test.lecturas = readings.map((row: any) => ({
        id: row.id,
        frecuenciaCardiaca: row.frecuenciaCardiaca,
        spo2: row.spo2,
        pasos: row.pasos,
        distancia: row.distancia,
        timestamp: row.timestamp,
      }));

      test.alertas = alerts.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        mensaje: row.mensaje,
        severidad: row.severidad,
        valor: row.valor,
        timestamp: row.timestamp,
      }));

      return test;
    } finally {
      connection.release();
    }
  }

  async getAllTests(): Promise<Test[]> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute('SELECT * FROM tests ORDER BY fecha DESC');
      
      const tests: Test[] = [];
      for (const row of rows) {
        const test = await this.getTestById(row.id);
        if (test) tests.push(test);
      }

      return tests;
    } finally {
      connection.release();
    }
  }

  async getAllTestsLite(limit: number = 25): Promise<Array<{ id: string; estado: string; createdAt: Date }>> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT id, estado, createdAt FROM tests ORDER BY createdAt DESC LIMIT ?',
        [limit]
      );

      return rows.map((row: any) => ({
        id: row.id,
        estado: row.estado,
        createdAt: row.createdAt,
      }));
    } finally {
      connection.release();
    }
  }

  async getTestsByDoctor(doctorName: string): Promise<Test[]> {
    const connection = await pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT id FROM tests WHERE medicoResponsable = ? ORDER BY fecha DESC',
        [doctorName]
      );

      const tests: Test[] = [];
      for (const row of rows) {
        const test = await this.getTestById(row.id);
        if (test) tests.push(test);
      }

      return tests;
    } finally {
      connection.release();
    }
  }

  async updateTest(id: string, updates: Partial<Test>): Promise<Test | undefined> {
    const connection = await pool.getConnection();
    try {
      const currentTest = await this.getTestById(id);
      if (!currentTest) return undefined;

      const resolvedPatient = updates.paciente
        ? {
            ...currentTest.paciente,
            ...updates.paciente,
          }
        : currentTest.paciente;

      const setClauses: string[] = [];
      const values: any[] = [];

      if (updates.paciente) {
        setClauses.push('paciente_id = ?');
        values.push(resolvedPatient.id ?? null);

        setClauses.push('paciente_nombreCompleto = ?');
        values.push(resolvedPatient.nombreCompleto ?? null);

        setClauses.push('paciente_edad = ?');
        values.push(resolvedPatient.edad ?? null);

        setClauses.push('paciente_altura = ?');
        values.push(resolvedPatient.altura ?? null);

        setClauses.push('paciente_peso = ?');
        values.push(resolvedPatient.peso ?? null);

        setClauses.push('paciente_sexo = ?');
        values.push(resolvedPatient.sexo ?? null);

        setClauses.push('paciente_raza = ?');
        values.push(resolvedPatient.raza ?? null);
      }

      if (updates.medicoResponsable !== undefined) {
        setClauses.push('medicoResponsable = ?');
        values.push(updates.medicoResponsable);
      }

      if (updates.enfermedadPulmonar !== undefined) {
        setClauses.push('enfermedadPulmonar = ?');
        values.push(updates.enfermedadPulmonar);
      }

      if (updates.numeroCaminata !== undefined) {
        setClauses.push('numeroCaminata = ?');
        values.push(updates.numeroCaminata);
      }

      if (updates.fechaCaminata !== undefined) {
        setClauses.push('fechaCaminata = ?');
        values.push(updates.fechaCaminata);
      }

      if (updates.presionSanguineaInicial !== undefined) {
        setClauses.push('presionSanguineaInicial = ?');
        values.push(updates.presionSanguineaInicial);
      }

      if (updates.oxigenoSupplementario !== undefined) {
        setClauses.push('oxigenoSupplementario = ?');
        values.push(updates.oxigenoSupplementario);
      }

      if (updates.estado) {
        setClauses.push('estado = ?');
        values.push(updates.estado);
      }
      if (updates.duracion !== undefined) {
        setClauses.push('duracion = ?');
        values.push(updates.duracion);
      }
      if (updates.distanciaTotal !== undefined) {
        setClauses.push('distanciaTotal = ?');
        values.push(updates.distanciaTotal);
      }
      if (updates.fcPromedio !== undefined) {
        setClauses.push('fcPromedio = ?');
        values.push(updates.fcPromedio);
      }
      if (updates.spo2Promedio !== undefined) {
        setClauses.push('spo2Promedio = ?');
        values.push(updates.spo2Promedio);
      }
      if (updates.observaciones) {
        setClauses.push('observaciones = ?');
        values.push(updates.observaciones);
      }

      if (setClauses.length === 0) return this.getTestById(id);

      values.push(id);
      await connection.execute(
        `UPDATE tests SET ${setClauses.join(', ')} WHERE id = ?`,
        values as any
      );

      return this.getTestById(id);
    } finally {
      connection.release();
    }
  }

  async updatePatientAcrossTests(
    patientId: string,
    data: {
      nombreCompleto: string;
      edad: number;
      altura: number;
      sexo: 'M' | 'F' | 'O';
      raza?: string;
      enfermedadPulmonar?: string;
    }
  ): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const [result]: any = await connection.execute(
        `UPDATE tests
         SET paciente_nombreCompleto = ?,
             paciente_edad = ?,
             paciente_altura = ?,
             paciente_sexo = ?,
             paciente_raza = ?,
             enfermedadPulmonar = COALESCE(?, enfermedadPulmonar)
         WHERE paciente_id = ?`,
        [
          data.nombreCompleto,
          data.edad,
          data.altura,
          data.sexo,
          data.raza ?? null,
          data.enfermedadPulmonar ?? null,
          patientId,
        ]
      );

      return result.affectedRows || 0;
    } finally {
      connection.release();
    }
  }

  async addTestReading(testId: string, reading: TestReading): Promise<TestReading> {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO test_readings (id, testId, frecuenciaCardiaca, spo2, pasos, distancia, tiempo)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reading.id,
          testId,
          reading.frecuenciaCardiaca,
          reading.spo2,
          reading.pasos,
          reading.distancia,
          reading.tiempo ?? 0,
        ]
      );
      return reading;
    } finally {
      connection.release();
    }
  }

  async addTestAlert(testId: string, alert: Alert): Promise<Alert> {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO alerts (id, testId, tipo, mensaje, severidad, valor)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [alert.id, testId, alert.tipo, alert.mensaje, alert.severidad, alert.valor]
      );
      return alert;
    } finally {
      connection.release();
    }
  }

  async deleteTest(id: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const [result]: any = await connection.execute(
        'DELETE FROM tests WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } finally {
      connection.release();
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      password: row.password,
      rol: row.rol,
      institucion: row.institucion,
      createdAt: row.createdAt,
    };
  }

  private mapRowToTest(row: any): Test {
    return {
      id: row.id,
      paciente: {
        id: row.paciente_id,
        nombreCompleto: row.paciente_nombreCompleto,
        edad: row.paciente_edad,
        altura: row.paciente_altura,
        peso: row.paciente_peso,
        sexo: row.paciente_sexo,
        raza: row.paciente_raza,
      },
      medicoResponsable: row.medicoResponsable,
      fecha: row.fecha,
      numeroCaminata: row.numeroCaminata,
      fechaCaminata: row.fechaCaminata,
      enfermedadPulmonar: row.enfermedadPulmonar,
      presionSanguineaInicial: row.presionSanguineaInicial,
      oxigenoSupplementario: row.oxigenoSupplementario,
      estado: row.estado,
      duracion: row.duracion,
      distanciaTotal: row.distanciaTotal,
      fcPromedio: row.fcPromedio,
      spo2Promedio: row.spo2Promedio,
      alertas: [],
      lecturas: [],
      observaciones: row.observaciones,
      createdAt: row.createdAt,
    };
  }
}

export const db = new Database();
