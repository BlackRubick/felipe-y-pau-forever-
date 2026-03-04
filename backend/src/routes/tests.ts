import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest } from '../middleware';
import { Test, TestReading, Alert, CreateTestRequest } from '../types';

const router = express.Router();

/**
 * POST /tests
 * Crear una nueva prueba
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      paciente,
      medicoResponsable,
      enfermedadPulmonar,
      numeroCaminata,
      fechaCaminata,
      presionSanguineaInicial,
      oxigenoSupplementario,
      observacionesPrevias,
    } = req.body as CreateTestRequest;

    const newTest: Test = {
      id: `test-${uuidv4().substring(0, 8)}`,
      paciente,
      medicoResponsable,
      fecha: new Date(),
      numeroCaminata,
      fechaCaminata: new Date(fechaCaminata),
      enfermedadPulmonar,
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
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /tests
 * Obtener todas las pruebas del doctor actual
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const allTests = await db.getAllTests();
    res.json(allTests);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /tests/:id
 * Obtener una prueba por ID
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const test = await db.getTestById(req.params.id);
    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /tests/:id/readings
 * Agregar una lectura a la prueba
 */
router.post('/:id/readings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { frecuenciaCardiaca, spo2, pasos, distancia, tiempo } = req.body;

    const reading: TestReading = {
      id: uuidv4(),
      frecuenciaCardiaca,
      spo2,
      pasos,
      distancia,
      timestamp: new Date(),
    };

    await db.addTestReading(req.params.id, reading);
    res.status(201).json(reading);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /tests/:id/alerts
 * Agregar una alerta a la prueba
 */
router.post('/:id/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
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
    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /tests/:id
 * Actualizar una prueba
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { estado, duracion, distanciaTotal, fcPromedio, spo2Promedio, observaciones } =
      req.body;

    const updated = await db.updateTest(req.params.id, {
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

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /tests/:id/finalize
 * Finalizar una prueba
 */
router.put('/:id/finalize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const test = await db.getTestById(req.params.id);
    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    // Calcular promedios si hay lecturas
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

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /tests/:id
 * Cancelar una prueba
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await db.updateTest(req.params.id, { estado: 'cancelada' });
    if (!updated) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
