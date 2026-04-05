import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest } from '../middleware';
import { Test, TestReading, Alert, CreateTestRequest } from '../types';
import { broadcastAlert, broadcastReading } from '../realtime';

const router = express.Router();
let currentActiveTestId: string | null = null;

const sanitizePatientId = (value: string | undefined) => {
  const clean = (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!clean) {
    return `patient-${uuidv4().substring(0, 8)}`;
  }

  const withPrefix = clean.startsWith('patient-') ? clean : `patient-${clean}`;
  return withPrefix.slice(0, 36);
};

const resolveActiveTest = async (): Promise<Test | null> => {
  const allTests = await db.getAllTests();
  const activeTests = allTests
    .filter((test) => test.estado === 'en_progreso')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeTest = activeTests[0] || null;
  if (activeTest) {
    if (currentActiveTestId !== activeTest.id) {
      currentActiveTestId = activeTest.id;
      console.log('🔁 Active test switched to latest:', currentActiveTestId);
    }
  } else {
    currentActiveTestId = null;
  }

  return activeTest;
};

const resolveDeviceCurrentTest = async (): Promise<Test | null> => {
  const active = await resolveActiveTest();
  if (active) return active;

  const allTests = await db.getAllTests();
  const candidate = allTests
    .filter((test) => test.estado !== 'cancelada')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

  if (candidate) {
    currentActiveTestId = candidate.id;
  }

  return candidate;
};

router.post('/', async (req, res: Response) => {
  try {
    const {
      paciente,
      medicoResponsable,
      enfermedadPulmonar,
      numeroCaminata,
      fechaCaminata,
      escalaBorg,
      presionSanguineaInicial,
      oxigenoSupplementario,
      observacionesPrevias,
    } = req.body as CreateTestRequest;

    if (!paciente?.nombreCompleto || !paciente?.edad || !paciente?.altura) {
      res.status(400).json({ error: 'Datos de paciente incompletos' });
      return;
    }

    const safeFechaCaminata = new Date(fechaCaminata);
    const normalizedFechaCaminata = Number.isNaN(safeFechaCaminata.getTime())
      ? new Date()
      : safeFechaCaminata;

    const normalizedPaciente = {
      ...paciente,
      id: sanitizePatientId(paciente.id),
      nombreCompleto: String(paciente.nombreCompleto).trim(),
      edad: Number(paciente.edad),
      altura: Number(paciente.altura),
      peso: paciente.peso !== undefined && paciente.peso !== null ? Number(paciente.peso) : undefined,
      raza: paciente.raza ? String(paciente.raza).trim() : undefined,
      sexo: paciente.sexo || 'O',
    };

    const newTest: Test = {
      id: `test-${uuidv4().substring(0, 8)}`,
      paciente: normalizedPaciente,
      medicoResponsable,
      fecha: new Date(),
      numeroCaminata,
      fechaCaminata: normalizedFechaCaminata,
      enfermedadPulmonar,
      escalaBorg: typeof escalaBorg === 'number' ? escalaBorg : undefined,
      presionSanguineaInicial,
      oxigenoSupplementario,
      estado: 'en_progreso',
      duracion: 0,
      distanciaTotal: 0,
      fcPromedio: 0,
      spo2Promedio: 0,
      alertas: [],
      lecturas: [],
      observaciones: observacionesPrevias,
      createdAt: new Date(),
    };

    const created = await db.createTest(newTest);
    currentActiveTestId = created.id;
    const persisted = await db.getTestById(created.id);
    res.status(201).json(persisted || created);
  } catch (error) {
    console.error('❌ Error creating test:', error);
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
  }
});

router.get('/', async (req, res: Response) => {
  try {
    if (req.query.lite === '1') {
      const limit = Number(req.query.limit || 25);
      const lite = await db.getAllTestsLite(Number.isFinite(limit) ? limit : 25);
      res.json(lite);
      return;
    }

    const allTests = await db.getAllTests();
    res.json(allTests);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/active', async (req, res: Response) => {
  try {
    const activeTest = await resolveActiveTest();

    if (!activeTest) {
      res.status(404).json({ error: 'No active test found' });
      return;
    }

    res.json(activeTest);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/current', async (req, res: Response) => {
  try {
    const activeTest = await resolveActiveTest();

    if (!activeTest) {
      res.status(404).json({ error: 'No active test found' });
      return;
    }

    res.json(activeTest);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/device/current', async (req, res: Response) => {
  try {
    const current = await resolveDeviceCurrentTest();

    if (!current) {
      res.status(404).json({ error: 'No test available for device' });
      return;
    }

    res.json({
      id: current.id,
      estado: current.estado,
      createdAt: current.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/patient/:patientId', async (req, res: Response) => {
  try {
    const { nombreCompleto, edad, altura, sexo, raza, enfermedadPulmonar } = req.body;

    if (!nombreCompleto || !edad || !altura || !sexo) {
      res.status(400).json({ error: 'Missing required patient fields' });
      return;
    }

    const updated = await db.updatePatientAcrossTests(req.params.patientId, {
      nombreCompleto,
      edad: Number(edad),
      altura: Number(altura),
      sexo,
      raza,
      enfermedadPulmonar,
    });

    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id((?!active$)[A-Za-z0-9\-]+)', async (req, res: Response) => {
  try {
    if (req.params.id === 'active' || req.params.id === 'current' || req.params.id === 'device') {
      const current = await resolveDeviceCurrentTest();
      if (!current) {
        res.status(404).json({ error: 'No test available for device' });
        return;
      }
      res.json(current);
      return;
    }

    const test = await db.getTestById(req.params.id);
    if (!test) {
      const fallback = await resolveDeviceCurrentTest();
      if (fallback) {
        res.json(fallback);
        return;
      }

      res.status(404).json({ error: 'Test not found' });
      return;
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/readings', async (req, res: Response) => {
  try {
    const { frecuenciaCardiaca, spo2, pasos, distancia, tiempo } = req.body;

    const reading: TestReading = {
      id: uuidv4(),
      frecuenciaCardiaca,
      spo2,
      pasos,
      distancia,
      tiempo: typeof tiempo === 'number' ? tiempo : 0,
      timestamp: new Date(),
    };

    await db.addTestReading(req.params.id, reading);
    broadcastReading(req.params.id, reading);
    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/alerts', async (req, res: Response) => {
  try {
    const { tipo, severidad, valor, mensaje } = req.body;

    const alert: Alert = {
      id: uuidv4(),
      tipo,
      severidad,
      valor,
      mensaje,
      timestamp: new Date(),
    };

    await db.addTestAlert(req.params.id, alert);
    broadcastAlert(req.params.id, alert);
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res: Response) => {
  try {
    const {
      paciente,
      medicoResponsable,
      enfermedadPulmonar,
      numeroCaminata,
      fechaCaminata,
      presionSanguineaInicial,
      oxigenoSupplementario,
      estado,
      duracion,
      distanciaTotal,
      fcPromedio,
      spo2Promedio,
      observaciones,
    } = req.body;

    const updated = await db.updateTest(req.params.id, {
      paciente,
      medicoResponsable,
      enfermedadPulmonar,
      numeroCaminata,
      fechaCaminata,
      presionSanguineaInicial,
      oxigenoSupplementario,
      estado,
      duracion,
      distanciaTotal,
      fcPromedio,
      spo2Promedio,
      observaciones,
    });

    if (!updated) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    if (estado === 'en_progreso') {
      currentActiveTestId = req.params.id;
    } else if (currentActiveTestId === req.params.id) {
      currentActiveTestId = null;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/finalize', async (req, res: Response) => {
  try {
    const test = await db.getTestById(req.params.id);
    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    if (test.lecturas.length > 0) {
      const fcSum = test.lecturas.reduce((sum, l) => sum + l.frecuenciaCardiaca, 0);
      const spo2Sum = test.lecturas.reduce((sum, l) => sum + l.spo2, 0);

      test.fcPromedio = Math.round(fcSum / test.lecturas.length);
      test.spo2Promedio = Math.round(spo2Sum / test.lecturas.length);
      test.distanciaTotal = test.lecturas[test.lecturas.length - 1]?.distancia || 0;
      test.duracion = test.lecturas.length; // En segundos
    }

    const updated = await db.updateTest(req.params.id, {
      ...test,
      estado: 'completada',
    });

    if (currentActiveTestId === req.params.id) {
      currentActiveTestId = null;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res: Response) => {
  try {
    const updated = await db.updateTest(req.params.id, { estado: 'cancelada' });
    if (!updated) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    if (currentActiveTestId === req.params.id) {
      currentActiveTestId = null;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
