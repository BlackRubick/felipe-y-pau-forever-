import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { authMiddleware, AuthRequest } from '../middleware';
import { Test, TestReading, Alert, CreateTestRequest } from '../types';
import { broadcastAlert, broadcastReading } from '../realtime';

// Use CommonJS require to avoid TS namespace/type-resolution issues on some setups.
const PDFDocument = require('pdfkit');
type PdfDoc = any;

const router = express.Router();
let currentActiveTestId: string | null = null;
const TEST_TARGET_SECONDS = 360;

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

  currentActiveTestId = null;
  return null;
};

const buildMinuteSummary = (readings: TestReading[]) => {
  const bucket = new Map<
    number,
    {
      fcSum: number;
      fcCount: number;
      spo2Sum: number;
      spo2Count: number;
      distancia: number;
    }
  >();

  for (const r of readings) {
    const elapsedSec = typeof r.tiempo === 'number' ? r.tiempo : 0;
    if (elapsedSec < 0 || elapsedSec >= TEST_TARGET_SECONDS) {
      continue;
    }
    const minute = Math.floor(elapsedSec / 60);

    if (!bucket.has(minute)) {
      bucket.set(minute, { fcSum: 0, fcCount: 0, spo2Sum: 0, spo2Count: 0, distancia: 0 });
    }

    const row = bucket.get(minute)!;

    if (typeof r.frecuenciaCardiaca === 'number' && r.frecuenciaCardiaca > 0) {
      row.fcSum += r.frecuenciaCardiaca;
      row.fcCount += 1;
    }

    if (typeof r.spo2 === 'number' && r.spo2 > 0) {
      row.spo2Sum += r.spo2;
      row.spo2Count += 1;
    }

    if (typeof r.distancia === 'number') {
      row.distancia = Math.max(row.distancia, r.distancia);
    }
  }

  return Array.from(bucket.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([minute, row]) => ({
      minute,
      fcAvg: row.fcCount > 0 ? Math.round(row.fcSum / row.fcCount) : 0,
      spo2Avg: row.spo2Count > 0 ? Math.round(row.spo2Sum / row.spo2Count) : 0,
      distancia: row.distancia,
    }));
};

const drawCard = (doc: PdfDoc, x: number, y: number, w: number, h: number, title: string, value: string) => {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke('#f8fafc', '#e2e8f0');
  doc.fillColor('#64748b').fontSize(9).text(title, x + 10, y + 8, { width: w - 20 });
  doc.fillColor('#0f172a').fontSize(14).text(value, x + 10, y + 24, { width: w - 20 });
};

const drawMinuteChart = (
  doc: PdfDoc,
  title: string,
  points: Array<{ x: number; y: number }>,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  yLabel: string
) => {
  doc.roundedRect(x, y, w, h, 8).fillAndStroke('#ffffff', '#e2e8f0');
  doc.fillColor('#0f172a').fontSize(11).text(title, x + 10, y + 10);

  const padLeft = 36;
  const padRight = 14;
  const padTop = 30;
  const padBottom = 24;
  const chartX = x + padLeft;
  const chartY = y + padTop;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).strokeColor('#cbd5e1').stroke();
  doc.moveTo(chartX, chartY).lineTo(chartX, chartY + chartH).strokeColor('#cbd5e1').stroke();

  if (!points.length) {
    doc.fillColor('#64748b').fontSize(9).text('Sin datos', chartX + 6, chartY + chartH / 2 - 6);
    return;
  }

  const minX = Math.min(...points.map((p) => p.x));
  const maxX = Math.max(...points.map((p) => p.x));
  const minYRaw = Math.min(...points.map((p) => p.y));
  const maxYRaw = Math.max(...points.map((p) => p.y));
  const yPad = Math.max(1, Math.round((maxYRaw - minYRaw) * 0.1));
  const minY = minYRaw - yPad;
  const maxY = maxYRaw + yPad;

  const toX = (v: number) => {
    if (maxX === minX) return chartX + chartW / 2;
    return chartX + ((v - minX) / (maxX - minX)) * chartW;
  };

  const toY = (v: number) => {
    if (maxY === minY) return chartY + chartH / 2;
    return chartY + chartH - ((v - minY) / (maxY - minY)) * chartH;
  };

  doc.strokeColor('#e2e8f0');
  for (let i = 1; i <= 3; i += 1) {
    const gy = chartY + (i * chartH) / 4;
    doc.moveTo(chartX, gy).lineTo(chartX + chartW, gy).stroke();
  }

  doc.strokeColor(color).lineWidth(2);
  points.forEach((p, idx) => {
    const px = toX(p.x);
    const py = toY(p.y);
    if (idx === 0) doc.moveTo(px, py);
    else doc.lineTo(px, py);
  });
  doc.stroke();

  const last = points[points.length - 1];
  const lx = toX(last.x);
  const ly = toY(last.y);
  doc.circle(lx, ly, 2.8).fillAndStroke(color, color);

  doc.fillColor('#64748b').fontSize(8).text(`${Math.round(maxYRaw)} ${yLabel}`, x + 8, chartY - 2);
  doc.text(`${Math.round(minYRaw)} ${yLabel}`, x + 8, chartY + chartH - 8);
  doc.text(`min ${minX + 1}`, chartX, chartY + chartH + 8);
  doc.text(`min ${maxX + 1}`, chartX + chartW - 28, chartY + chartH + 8);
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

    const borgParsed = Number(escalaBorg);
    const escalaBorgNormalizada = Number.isFinite(borgParsed)
      ? Math.max(0, Math.min(10, Math.round(borgParsed)))
      : undefined;

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
      escalaBorg: escalaBorgNormalizada,
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

router.get('/:id/report/pdf', async (req, res: Response) => {
  try {
    const test = await db.getTestById(req.params.id);

    if (!test) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    const minuteRows = buildMinuteSummary(test.lecturas);
    const distanciaTotal =
      test.distanciaTotal ||
      (test.lecturas.length > 0 ? test.lecturas[test.lecturas.length - 1].distancia || 0 : 0);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const filename = `reporte-${test.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const headerY = 40;
    doc.roundedRect(40, headerY, 515, 70, 10).fill('#1e3a8a');
    doc.fillColor('#ffffff').fontSize(20).text('Reporte de Prueba de Caminata 6 Minutos', 56, headerY + 18);
    doc.fontSize(10).fillColor('#dbeafe').text(`Generado: ${new Date().toLocaleString()}`, 56, headerY + 48);
    doc.text(`ID Prueba: ${test.id}`, 350, headerY + 48, { width: 180, align: 'right' });

    let y = 128;
    doc.fillColor('#1e3a8a').fontSize(14).text('Datos del Paciente', 40, y);
    y += 24;

    doc.fontSize(10).fillColor('#0f172a');
    const patientLines = [
      ['Nombre', test.paciente.nombreCompleto || '-'],
      ['ID Paciente', test.paciente.id || '-'],
      ['Medico Responsable', test.medicoResponsable || '-'],
      ['Edad', `${test.paciente.edad ?? '-'} anios`],
      ['Sexo', test.paciente.sexo || '-'],
      ['Raza', test.paciente.raza || '-'],
      ['Altura', `${test.paciente.altura ?? '-'} cm`],
      ['Peso', `${test.paciente.peso ?? '-'} kg`],
      ['Presion Sanguinea Inicial', test.presionSanguineaInicial || '-'],
      ['Oxigeno Suplementario', test.oxigenoSupplementario ? 'Si' : 'No'],
      ['Escala de Borg', typeof test.escalaBorg === 'number' ? `${test.escalaBorg}/10` : '-'],
    ];

    patientLines.forEach(([label, value]) => {
      doc.fillColor('#475569').text(`${label}:`, 44, y, { width: 170 });
      doc.fillColor('#0f172a').text(String(value), 190, y, { width: 350 });
      y += 18;
    });

    y += 8;
    doc.fillColor('#1e3a8a').fontSize(14).text('Resultados de la Prueba', 40, y);
    y += 22;

    const fcValues = test.lecturas.map((r) => r.frecuenciaCardiaca).filter((v) => typeof v === 'number' && v > 0);
    const spo2Values = test.lecturas.map((r) => r.spo2).filter((v) => typeof v === 'number' && v > 0);
    const fcMin = fcValues.length ? Math.min(...fcValues) : 0;
    const fcMax = fcValues.length ? Math.max(...fcValues) : 0;
    const fcAvg = fcValues.length ? Math.round(fcValues.reduce((a, b) => a + b, 0) / fcValues.length) : 0;
    const spo2Min = spo2Values.length ? Math.min(...spo2Values) : 0;
    const spo2Avg = spo2Values.length ? Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length) : 0;

    drawCard(doc, 40, y, 120, 58, 'Duracion', `${Math.floor((test.duracion || 0) / 60)} min ${(test.duracion || 0) % 60} s`);
    drawCard(doc, 172, y, 120, 58, 'Distancia total', `${distanciaTotal || 0} m`);
    drawCard(doc, 304, y, 120, 58, 'FC promedio', `${fcAvg} BPM`);
    drawCard(doc, 436, y, 120, 58, 'SpO2 promedio', `${spo2Avg}%`);

    y += 74;
    drawCard(doc, 40, y, 120, 58, 'FC minima', `${fcMin} BPM`);
    drawCard(doc, 172, y, 120, 58, 'FC maxima', `${fcMax} BPM`);
    drawCard(doc, 304, y, 120, 58, 'SpO2 minima', `${spo2Min}%`);
    drawCard(doc, 436, y, 120, 58, 'Pasos', `${test.lecturas.length ? Math.max(...test.lecturas.map((r) => r.pasos || 0)) : 0}`);

    y += 86;
    doc.fillColor('#1e3a8a').fontSize(14).text('Promedios por Minuto (BPM / SpO2 / Distancia)', 40, y);
    y += 22;

    const headers = ['Minuto', 'BPM prom', 'SpO2 prom', 'Distancia (m)'];
    const colX = [48, 150, 260, 380];

    if (y > 680) {
      doc.addPage();
      y = 48;
    }

    doc.fontSize(11).fillColor('#0f172a');
    headers.forEach((h, i) => doc.text(h, colX[i], y));
    y += 18;
    doc.moveTo(48, y - 4).lineTo(545, y - 4).strokeColor('#cbd5e1').stroke();

    if (minuteRows.length === 0) {
      doc.fillColor('#64748b').text('Sin lecturas para resumir por minuto.', 48, y + 6);
    } else {
      for (const row of minuteRows) {
        if (y > 760) {
          doc.addPage();
          y = 60;
          doc.fontSize(11).fillColor('#0f172a');
          headers.forEach((h, i) => doc.text(h, colX[i], y));
          y += 18;
          doc.moveTo(48, y - 4).lineTo(545, y - 4).strokeColor('#cbd5e1').stroke();
        }

        doc.fillColor('#1e293b');
        doc.text(`${row.minute + 1}`, colX[0], y);
        doc.text(`${row.fcAvg}`, colX[1], y);
        doc.text(`${row.spo2Avg}`, colX[2], y);
        doc.text(`${row.distancia}`, colX[3], y);
        doc.moveTo(48, y + 14).lineTo(545, y + 14).strokeColor('#f1f5f9').stroke();
        y += 16;
      }
    }

    const fcPoints = minuteRows.map((r) => ({ x: r.minute, y: r.fcAvg }));
    const spo2Points = minuteRows.map((r) => ({ x: r.minute, y: r.spo2Avg }));

    doc.addPage();
    doc.fillColor('#1e3a8a').fontSize(16).text('Graficas Finales del Test', 40, 44);
    doc.fillColor('#64748b').fontSize(10).text('Curvas por minuto calculadas al concluir la prueba', 40, 64);

    drawMinuteChart(doc, 'Frecuencia Cardiaca por Minuto', fcPoints, 40, 92, 515, 210, '#b91c1c', 'BPM');
    drawMinuteChart(doc, 'SpO2 por Minuto', spo2Points, 40, 320, 515, 210, '#0369a1', '%');

    // Bloque de validacion clinica sin logo
    const footerTop = 560;
    doc.strokeColor('#cbd5e1').lineWidth(1);
    doc.moveTo(70, footerTop + 26).lineTo(260, footerTop + 26).stroke();
    doc.moveTo(335, footerTop + 26).lineTo(525, footerTop + 26).stroke();

    doc.fillColor('#475569').fontSize(9);
    doc.text(`Paciente: ${test.paciente.nombreCompleto || '-'}`, 360, footerTop + 30);

    doc.fillColor('#64748b').fontSize(8);
    doc.text(
      `Documento clinico generado automaticamente por Panel Clinico · ${new Date().toLocaleString()}`,
      40,
      620,
      { width: 515, align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('❌ Error generating PDF report:', error);
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
      const maxReadingTime = test.lecturas.reduce((max, l) => Math.max(max, l.tiempo || 0), 0);

      test.fcPromedio = Math.round(fcSum / test.lecturas.length);
      test.spo2Promedio = Math.round(spo2Sum / test.lecturas.length);
      test.distanciaTotal = test.lecturas[test.lecturas.length - 1]?.distancia || 0;
      test.duracion = Math.max(test.duracion || 0, maxReadingTime, test.lecturas.length);
    }

    const finalStatus = (test.duracion || 0) >= 360 ? 'completada' : 'cancelada';
    const observacionesBase = (test.observaciones || '').trim();
    const cancelReason =
      finalStatus === 'cancelada'
        ? `Finalizada antes de 6 minutos (duracion=${test.duracion || 0}s)`
        : '';

    const updated = await db.updateTest(req.params.id, {
      ...test,
      estado: finalStatus,
      observaciones:
        cancelReason && !observacionesBase.includes('Finalizada antes de 6 minutos')
          ? observacionesBase
            ? `${observacionesBase} | ${cancelReason}`
            : cancelReason
          : observacionesBase,
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
    const deleted = await db.deleteTest(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Test not found' });
      return;
    }

    if (currentActiveTestId === req.params.id) {
      currentActiveTestId = null;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
