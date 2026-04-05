import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Card, Button } from '../components/common';
import testService from '../services/testService';
import { Test } from '../types';

interface BackendRealtimeMessage {
  type: 'subscribed' | 'reading' | 'alert' | 'error';
  testId?: string;
  payload?: any;
  timestamp: string;
}

interface LineChartPoint {
  x: number;
  y: number;
}

const TEST_TARGET_SECONDS = 360;

const formatClock = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getRealtimeWsUrl = (testId: string) => {
  const wsBase = ((globalThis as any)?.process?.env?.REACT_APP_WS_URL as string | undefined) || 'ws://localhost:3001';
  return `${wsBase}/ws/tests?testId=${encodeURIComponent(testId)}`;
};

const MiniLineChart: React.FC<{
  title: string;
  colorClass: string;
  stroke: string;
  glow: string;
  areaStart: string;
  areaEnd: string;
  data: LineChartPoint[];
  unit: string;
}> = ({ title, colorClass, stroke, glow, areaStart, areaEnd, data, unit }) => {
  const width = 900;
  const height = 220;
  const padding = 28;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (!data.length) {
    return (
      <div className={`rounded-2xl p-5 shadow-lg ${colorClass}`}>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <div className="h-48 rounded-xl border border-white/60 bg-white/70 backdrop-blur flex items-center justify-center text-slate-500">
          Esperando lecturas...
        </div>
      </div>
    );
  }

  const xMin = data[0].x;
  const xMax = data[data.length - 1].x || xMin + 1;
  const yVals = data.map((d) => d.y);
  const yMinRaw = Math.min(...yVals);
  const yMaxRaw = Math.max(...yVals);
  const yPad = Math.max(2, (yMaxRaw - yMinRaw) * 0.1);
  const yMin = yMinRaw - yPad;
  const yMax = yMaxRaw + yPad;

  const toSvgX = (x: number) => {
    if (xMax === xMin) return width / 2;
    return padding + ((x - xMin) / (xMax - xMin)) * (width - padding * 2);
  };

  const toSvgY = (y: number) => {
    if (yMax === yMin) return height / 2;
    return height - padding - ((y - yMin) / (yMax - yMin)) * (height - padding * 2);
  };

  const points = data.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(' ');
  const last = data[data.length - 1];
  const areaPath = `${points} ${toSvgX(data[data.length - 1].x)},${height - padding} ${toSvgX(data[0].x)},${height - padding}`;
  const gridLines = 4;
  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  const onMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const index = Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))));
    setHoveredIndex(index);
  };

  return (
    <div className={`rounded-2xl p-5 shadow-lg ring-1 ring-black/5 ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <span className="text-sm font-semibold text-slate-700">
          Último: {last.y} {unit}
        </span>
      </div>

      <div className="rounded-xl border border-white/70 bg-white/75 backdrop-blur p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52">
          <defs>
            <linearGradient id={`area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaStart} stopOpacity="0.65" />
              <stop offset="100%" stopColor={areaEnd} stopOpacity="0.04" />
            </linearGradient>
            <filter id={`glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const y = padding + (i * (height - padding * 2)) / gridLines;
            return (
              <line
                key={`grid-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="4 6"
                opacity="0.45"
              />
            );
          })}

          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#94a3b8" strokeWidth="1" />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#94a3b8"
            strokeWidth="1"
          />

          <polygon points={areaPath} fill={`url(#area-${chartId})`} />

          <polyline
            fill="none"
            stroke={glow}
            strokeWidth="6"
            points={points}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.35"
          />
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            points={points}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter={`url(#glow-${chartId})`}
          />

          {hoveredPoint && (
            <>
              <line
                x1={toSvgX(hoveredPoint.x)}
                y1={padding}
                x2={toSvgX(hoveredPoint.x)}
                y2={height - padding}
                stroke={stroke}
                strokeDasharray="3 4"
                strokeWidth="1"
                opacity="0.7"
              />
              <circle cx={toSvgX(hoveredPoint.x)} cy={toSvgY(hoveredPoint.y)} r="5.5" fill={stroke} />
              <circle cx={toSvgX(hoveredPoint.x)} cy={toSvgY(hoveredPoint.y)} r="2.5" fill="#fff" />
            </>
          )}

          <rect
            x={padding}
            y={padding}
            width={width - padding * 2}
            height={height - padding * 2}
            fill="transparent"
            onMouseMove={onMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          />

          <circle cx={toSvgX(last.x)} cy={toSvgY(last.y)} r="4" fill={stroke} />
        </svg>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 px-1">
          <span>Mín: {Math.round(yMinRaw)} {unit}</span>
          <span>
            {hoveredPoint ? `Muestra ${hoveredIndex! + 1}: ${hoveredPoint.y} ${unit}` : `Total: ${data.length} muestras`}
          </span>
          <span>Máx: {Math.round(yMaxRaw)} {unit}</span>
        </div>
      </div>
    </div>
  );
};

interface ReportData {
  id: string;
  paciente: string;
  edad: number;
  sexo: string;
  borg: number;
  enfermedad: string;
  fecha: string;
  duracion: string;
  distancia: number;
  velocidadPromedio: number;
  pasos: number;
  fcReposo: number;
  fcPico: number;
  fcPromedio: number;
  fcRecuperacion: number;
  spo2Inicial: number;
  spo2Minimo: number;
  spo2Promedio: number;
  presionInicial: string;
  oxigenoSupplementario: boolean;
  resultado: 'normal' | 'anormal' | 'crítico';
  alertas: number;
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = (seconds || 0) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const toReportData = (test: Test): ReportData => {
  const fcVals = test.readings.map((r) => r.fc || 0);
  const spo2Vals = test.readings.map((r) => r.spo2 || 0);
  const pasosVals = test.readings.map((r) => r.pasos || 0);
  const distanciaVals = test.readings.map((r) => r.distancia || 0);

  const fcPromedio = fcVals.length ? Math.round(fcVals.reduce((a, b) => a + b, 0) / fcVals.length) : 0;
  const spo2Promedio = spo2Vals.length ? Math.round(spo2Vals.reduce((a, b) => a + b, 0) / spo2Vals.length) : 0;
  const distancia = distanciaVals.length ? Math.max(...distanciaVals) : 0;
  const pasos = pasosVals.length ? Math.max(...pasosVals) : 0;
  const horas = (test.duration || 0) / 3600;
  const velocidadPromedio = horas > 0 ? (distancia / 1000) / horas : 0;

  const spo2Minimo = spo2Vals.length ? Math.min(...spo2Vals) : 0;
  const fcPico = fcVals.length ? Math.max(...fcVals) : 0;
  const resultado: 'normal' | 'anormal' | 'crítico' =
    spo2Minimo < 88 || fcPico > 140 ? 'crítico' : spo2Minimo < 92 || fcPico > 120 ? 'anormal' : 'normal';

  return {
    id: test.id,
    paciente: test.testConfig.pacienteNombre,
    edad: test.testConfig.pacienteEdad,
    sexo: test.testConfig.sexo === 'M' ? 'Masculino' : test.testConfig.sexo === 'F' ? 'Femenino' : 'Otro',
    borg: test.testConfig.escalaBorg ?? 0,
    enfermedad: test.testConfig.tipoCirugia,
    fecha: new Date(test.createdAt || test.startTime).toISOString().split('T')[0],
    duracion: formatDuration(test.duration),
    distancia,
    velocidadPromedio,
    pasos,
    fcReposo: fcVals.length ? fcVals[0] : 0,
    fcPico,
    fcPromedio,
    fcRecuperacion: fcVals.length ? fcVals[fcVals.length - 1] : 0,
    spo2Inicial: spo2Vals.length ? spo2Vals[0] : 0,
    spo2Minimo,
    spo2Promedio,
    presionInicial: test.testConfig.presionSanguineaInicial || '-',
    oxigenoSupplementario: !!test.testConfig.oxigenoSupplementario,
    resultado,
    alertas: test.alerts.length,
  };
};

export const ReportesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'resumen' | 'graficos' | 'observaciones'>(() => {
    const tab = searchParams.get('tab');
    return tab === 'graficos' || tab === 'observaciones' ? tab : 'resumen';
  });
  const [chartRange, setChartRange] = useState<'all' | 'last100'>('all');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const autoFinalizeRequestedRef = useRef<string | null>(null);
  const completionAlertShownRef = useRef<Set<string>>(new Set());
  const requestedTestId = searchParams.get('testId') || '';

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (requestedTestId) {
          const all = await testService.getAllTests();
          const exact = all.find((t) => t.id === requestedTestId) || null;

          if (exact) {
            if ((exact.readings?.length || 0) > 0) {
              setCurrentTest(exact);
              setLastRefresh(new Date());
              console.log('✅ Test cargado por testId exacto:', exact.id, 'Lecturas:', exact.readings.length);
              return;
            }

            // Si el listado viene resumido/sin lecturas, pedir detalle puntual por ID.
            try {
              const detailed = await testService.getTest(requestedTestId);
              setCurrentTest(detailed);
              setLastRefresh(new Date());
              console.log('✅ Test detallado cargado:', detailed.id, 'Lecturas:', detailed.readings.length);
              return;
            } catch {
              setCurrentTest(exact);
            }

            setLastRefresh(new Date());
            console.log('✅ Test cargado por testId exacto:', exact.id, 'Lecturas:', exact.readings.length);
            return;
          }

          try {
            const test = await testService.getTest(requestedTestId);
            if (test?.id === requestedTestId) {
              setCurrentTest(test);
              setLastRefresh(new Date());
              console.log('✅ Test cargado por endpoint:', test.id, 'Lecturas:', test.readings.length);
            } else {
              const fallback = all[0] || null;
              setCurrentTest(fallback);
              setLastRefresh(new Date());
              console.warn('⚠️ testId no coincide con respuesta del backend, usando fallback:', fallback?.id);
            }
          } catch {
            const fallback = all[0] || null;
            setCurrentTest(fallback);
            setLastRefresh(new Date());
            if (fallback) {
              console.warn('⚠️ testId no encontrado, usando fallback:', fallback.id);
            }
          }
        } else {
          const all = await testService.getAllTests();
          setCurrentTest(all[0] || null);
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('❌ Error cargando test:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [requestedTestId]);

  // Polling fallback cuando WebSocket no está conectado
  useEffect(() => {
    if (activeTab !== 'graficos' || !currentTest?.id || isWsConnected) return;

    console.log('📊 Iniciando polling (WebSocket no disponible)');
    const interval = setInterval(async () => {
      try {
        const updated = await testService.getTest(currentTest.id);
        setCurrentTest(updated);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('❌ Error en polling:', error);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [activeTab, currentTest?.id, isWsConnected]);

  // WebSocket para datos en tiempo real
  useEffect(() => {
    if (activeTab !== 'graficos' || !currentTest?.id) return;

    const wsUrl = getRealtimeWsUrl(currentTest.id);
    console.log('🔌 Conectando WebSocket a:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      setIsWsConnected(true);
      setLastRefresh(new Date());
    };

    ws.onclose = () => {
      console.log('❌ WebSocket cerrado');
      setIsWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
      setIsWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as BackendRealtimeMessage;
        console.log('📨 Mensaje WebSocket recibido:', message.type);

        if (message.type === 'reading' && message.payload) {
          setCurrentTest((prev) => {
            if (!prev || prev.id !== message.testId) return prev;

            const incoming = message.payload;
            const exists = prev.readings.some((r) => r.id === incoming.id);
            if (exists) {
              console.log('⏭️ Lectura duplicada, ignorando');
              return prev;
            }

            console.log('📈 Nueva lectura:', { fc: incoming.frecuenciaCardiaca, spo2: incoming.spo2 });
            
            return {
              ...prev,
              readings: [
                ...prev.readings,
                {
                  id: incoming.id,
                  testId: prev.id,
                  fc: incoming.frecuenciaCardiaca,
                  spo2: incoming.spo2,
                  pasos: incoming.pasos,
                  distancia: incoming.distancia,
                  timestamp: typeof incoming.tiempo === 'number' ? incoming.tiempo : prev.readings.length,
                  receivedAt: incoming.timestamp ? new Date(incoming.timestamp).toISOString() : new Date().toISOString(),
                },
              ],
            };
          });
          setLastRefresh(new Date());
        }

        if (message.type === 'alert' && message.payload) {
          console.log('🚨 Nueva alerta:', message.payload.tipo);
          setCurrentTest((prev) => {
            if (!prev || prev.id !== message.testId) return prev;

            const incoming = message.payload;
            const exists = prev.alerts.some((a) => a.id === incoming.id);
            if (exists) return prev;

            return {
              ...prev,
              alerts: [
                ...prev.alerts,
                {
                  id: incoming.id,
                  testId: prev.id,
                  type: incoming.tipo || 'caida_abrupta',
                  severity: incoming.severidad || 'warning',
                  message: incoming.mensaje || '',
                  value: incoming.valor,
                  timestamp: prev.readings.length,
                },
              ],
            };
          });
          setLastRefresh(new Date());
        }
      } catch (error) {
        console.error('❌ Error procesando mensaje WebSocket:', error);
      }
    };

    return () => {
      console.log('🛑 Cerrando WebSocket');
      ws.close();
      setIsWsConnected(false);
    };
  }, [activeTab, currentTest?.id]);

  const report = useMemo(() => (currentTest ? toReportData(currentTest) : null), [currentTest]);

  const testProgress = useMemo(() => {
    if (!currentTest) {
      return {
        elapsed: 0,
        elapsedRaw: 0,
        remaining: TEST_TARGET_SECONDS,
        progress: 0,
        shouldAutoFinalize: false,
        statusLabel: 'Sin prueba',
        statusClass: 'text-slate-600 bg-slate-100 border-slate-200',
      };
    }

    const maxReadingSec = currentTest.readings.reduce((max, r) => Math.max(max, r.timestamp || 0), 0);
    const serverDuration = currentTest.duration || 0;
    const startMs = new Date(currentTest.startTime).getTime();
    const clockDuration = Number.isFinite(startMs) ? Math.max(0, Math.floor((nowMs - startMs) / 1000)) : 0;
    const elapsedRaw =
      currentTest.status === 'en_progreso'
        ? Math.max(serverDuration, maxReadingSec, clockDuration)
        : Math.max(serverDuration, maxReadingSec);

    const elapsed = Math.max(0, Math.min(elapsedRaw, TEST_TARGET_SECONDS));
    const remaining = Math.max(0, TEST_TARGET_SECONDS - elapsed);
    const progress = Math.min(100, (elapsed / TEST_TARGET_SECONDS) * 100);
    const shouldAutoFinalize = currentTest.status === 'en_progreso' && elapsedRaw >= TEST_TARGET_SECONDS;

    if (currentTest.status === 'completada') {
      return {
        elapsed,
        elapsedRaw,
        remaining: 0,
        progress: 100,
        shouldAutoFinalize: false,
        statusLabel: 'Completada',
        statusClass: 'text-emerald-800 bg-emerald-100 border-emerald-200',
      };
    }

    if (currentTest.status === 'cancelada') {
      return {
        elapsed,
        elapsedRaw,
        remaining,
        progress,
        shouldAutoFinalize: false,
        statusLabel: 'Interrumpida',
        statusClass: 'text-amber-800 bg-amber-100 border-amber-200',
      };
    }

    return {
      elapsed,
      elapsedRaw,
      remaining,
      progress,
      shouldAutoFinalize,
      statusLabel: shouldAutoFinalize ? 'Completando...' : 'En progreso',
      statusClass: shouldAutoFinalize
        ? 'text-indigo-800 bg-indigo-100 border-indigo-200'
        : 'text-sky-800 bg-sky-100 border-sky-200',
    };
  }, [currentTest, nowMs]);

  useEffect(() => {
    if (!currentTest?.id || !testProgress.shouldAutoFinalize) return;
    if (autoFinalizeRequestedRef.current === currentTest.id) return;

    autoFinalizeRequestedRef.current = currentTest.id;

    const run = async () => {
      try {
        const updated = await testService.finalizeTest(currentTest.id);
        setCurrentTest(updated);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('❌ Error auto-finalizando test en frontend:', error);
        autoFinalizeRequestedRef.current = null;
      }
    };

    run();
  }, [currentTest?.id, testProgress.shouldAutoFinalize]);

  useEffect(() => {
    if (!currentTest?.id) return;
    if (currentTest.status !== 'completada') return;
    if (testProgress.elapsedRaw < TEST_TARGET_SECONDS) return;
    if (completionAlertShownRef.current.has(currentTest.id)) return;

    completionAlertShownRef.current.add(currentTest.id);

    void Swal.fire({
      icon: 'success',
      title: 'Prueba finalizada',
      text: 'Se cumplieron los 6 minutos del test correctamente.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#0f766e',
    });
  }, [currentTest?.id, currentTest?.status, testProgress.elapsedRaw]);

  const chartSeries = useMemo(() => {
    const readings = currentTest?.readings || [];
    const series = readings.map((r, i) => ({
      // Use sequential index so all points are rendered even when device sends many
      // readings with the same timestamp value.
      x: i,
      fc: r.fc || 0,
      spo2: r.spo2 || 0,
      distancia: r.distancia || 0,
    }));

    const visible = chartRange === 'last100' ? series.slice(-100) : series;

    return {
      fc: visible.map((p) => ({ x: p.x, y: p.fc })),
      spo2: visible.map((p) => ({ x: p.x, y: p.spo2 })),
      distancia: visible.map((p) => ({ x: p.x, y: p.distancia })),
      visiblePoints: visible.length,
      totalPoints: series.length,
    };
  }, [currentTest, chartRange]);

  const handleGeneratePdf = async () => {
    if (!currentTest?.id) return;

    try {
      setIsGeneratingPdf(true);
      const pdfBlob = await testService.generatePDF(currentTest.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${currentTest.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      void Swal.fire({
        icon: 'error',
        title: 'No se pudo generar PDF',
        text: 'Ocurrio un error al generar el reporte. Intenta de nuevo.',
        confirmButtonColor: '#b91c1c',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-gray-600">Cargando reporte...</div>;
  }

  if (!report) {
    return <div className="max-w-6xl mx-auto px-4 py-8 text-gray-600">No hay pruebas para mostrar.</div>;
  }

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case 'normal':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'anormal':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'crítico':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Reporte de Prueba 6MWT</h1>
        <p className="text-slate-600">Análisis detallado de la prueba de caminata de 6 minutos</p>
      </div>

      
      <Card className="mb-6 border border-slate-200 shadow-lg rounded-2xl" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{report.paciente}</h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Edad</p>
                <p className="font-semibold text-slate-900">{report.edad} años</p>
              </div>
              <div>
                <p className="text-slate-500">Sexo</p>
                <p className="font-semibold text-slate-900">{report.sexo}</p>
              </div>
              <div>
                <p className="text-slate-500">Borg</p>
                <p className="font-semibold text-slate-900">{report.borg}/10</p>
              </div>
              <div>
                <p className="text-slate-500">Diagnóstico</p>
                <p className="font-semibold text-slate-900">{report.enfermedad}</p>
              </div>
              <div>
                <p className="text-slate-500">Fecha</p>
                <p className="font-semibold text-slate-900">{report.fecha}</p>
              </div>
            </div>
          </div>
          <div className={`px-6 py-4 rounded-lg ${getResultadoColor(report.resultado)}`}>
            <p className="text-sm font-semibold mb-1">Resultado</p>
            <p className="text-2xl font-bold capitalize">{report.resultado}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-6 border border-slate-200 shadow-lg rounded-2xl" padding="lg">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Progreso del test de 6 minutos</h3>
            <p className="text-sm text-slate-600">Seguimiento en tiempo real del tiempo transcurrido y restante</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${testProgress.statusClass}`}>
            {testProgress.statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Tiempo transcurrido</p>
            <p className="text-3xl font-bold text-slate-900">{formatClock(testProgress.elapsed)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Tiempo restante</p>
            <p className="text-3xl font-bold text-slate-900">{formatClock(testProgress.remaining)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Meta</p>
            <p className="text-3xl font-bold text-slate-900">6:00</p>
          </div>
        </div>

        <div>
          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${testProgress.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Avance: {testProgress.progress.toFixed(1)}% del objetivo de 6 minutos
          </p>
        </div>
      </Card>

      
      <div className="flex gap-4 mb-6 border-b border-slate-300">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-2 font-medium border-b-2 transition-all ${
            activeTab === 'resumen'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
           Resumen
        </button>
        <button
          onClick={() => setActiveTab('graficos')}
          className={`px-4 py-2 font-medium border-b-2 transition-all ${
            activeTab === 'graficos'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Gráficos
        </button>
        <button
          onClick={() => setActiveTab('observaciones')}
          className={`px-4 py-2 font-medium border-b-2 transition-all ${
            activeTab === 'observaciones'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
           Observaciones
        </button>
      </div>

      
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Métricas Principales</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Distancia Recorrida</span>
                <span className="text-2xl font-bold text-slate-900">{report.distancia} m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Velocidad Promedio</span>
                <span className="text-2xl font-bold text-slate-900">{report.velocidadPromedio.toFixed(2)} km/h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Pasos</span>
                <span className="text-2xl font-bold text-slate-900">{report.pasos}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Duración</span>
                <span className="text-2xl font-bold text-slate-900">{report.duracion}</span>
              </div>
            </div>
          </Card>

          
          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Frecuencia Cardíaca (BPM)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">FC en Reposo</span>
                <span className="text-2xl font-bold text-slate-900">{report.fcReposo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">FC Promedio</span>
                <span className="text-2xl font-bold text-slate-900">{report.fcPromedio}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">FC Máxima</span>
                <span className="text-2xl font-bold text-slate-900">{report.fcPico}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">FC Recuperación (1 min)</span>
                <span className="text-2xl font-bold text-slate-900">{report.fcRecuperacion}</span>
              </div>
            </div>
          </Card>

          
          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Saturación de Oxígeno (%)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">SpO₂ Inicial</span>
                <span className="text-2xl font-bold text-slate-900">{report.spo2Inicial}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">SpO₂ Promedio</span>
                <span className="text-2xl font-bold text-slate-900">{report.spo2Promedio}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">SpO₂ Mínimo</span>
                <span className="text-2xl font-bold text-slate-900">{report.spo2Minimo}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">O₂ Suplementario</span>
                <span className="text-xl font-bold text-slate-900">
                  {report.oxigenoSupplementario ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </Card>

          
          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Datos Basales</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Escala de Borg</span>
                <span className="text-2xl font-bold text-slate-900">{report.borg}/10</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Presión Sanguínea Inicial</span>
                <span className="text-xl font-bold text-slate-900">{report.presionInicial}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-700">Alertas Detectadas</span>
                <span className="text-2xl font-bold text-slate-900">{report.alertas}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'graficos' && (
        <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
          <div className="space-y-8">
            <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-medium text-slate-800">
                  {isWsConnected
                    ? 'Tiempo real '
                    : 'WebSocket no disponible.'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setChartRange('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      chartRange === 'all'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Todo
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange('last100')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                      chartRange === 'last100'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Últimos 100
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                {lastRefresh ? `Última actualización: ${lastRefresh.toLocaleTimeString()}` : 'Sin actualizaciones'}
                {' · '}Puntos visibles: {chartSeries.visiblePoints}
                {' · '}Total: {chartSeries.totalPoints}
              </p>
            </div>

            <MiniLineChart
              title="Evolución de Frecuencia Cardíaca"
              colorClass="bg-gradient-to-br from-rose-50 via-white to-orange-50 border border-rose-100"
              stroke="#b91c1c"
              glow="#fb7185"
              areaStart="#fda4af"
              areaEnd="#fff1f2"
              data={chartSeries.fc}
              unit="BPM"
            />

            <MiniLineChart
              title="Evolución de SpO₂"
              colorClass="bg-gradient-to-br from-cyan-50 via-white to-sky-50 border border-cyan-100"
              stroke="#0369a1"
              glow="#22d3ee"
              areaStart="#7dd3fc"
              areaEnd="#ecfeff"
              data={chartSeries.spo2}
              unit="%"
            />

            <MiniLineChart
              title="Distancia Acumulada"
              colorClass="bg-gradient-to-br from-emerald-50 via-white to-lime-50 border border-emerald-100"
              stroke="#047857"
              glow="#34d399"
              areaStart="#6ee7b7"
              areaEnd="#ecfdf5"
              data={chartSeries.distancia}
              unit="m"
            />
          </div>
        </Card>
      )}

      {activeTab === 'observaciones' && (
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Hallazgos Clínicos</h3>
            <div className="space-y-3 text-slate-700">
              <p>✓ Paciente completó exitosamente los 6 minutos de caminata</p>
              <p>✓ Distancia recorrida dentro de rangos normales para su grupo de edad</p>
              <p>✓ Respuesta cardiovascular adecuada al ejercicio</p>
              <p>⚠ Leve desaturación mínima (SpO₂ 90%) en minuto 4</p>
              <p>✓ Recuperación cardíaca normal</p>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Observaciones Clínicas</h3>
            <textarea
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              rows={6}
              placeholder="Observaciones adicionales del médico..."
              defaultValue="Paciente toleró adecuadamente el test. Se observó respiración disnéica leve. Sin síncope. Caminar fue con buena técnica."
            />
          </Card>

          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Interpretación</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-slate-900">
                <strong>Resultado: NORMAL</strong>
              </p>
              <p className="text-slate-700 text-sm mt-2">
                El paciente mostró una tolerancia normal al ejercicio con valores dentro de los rangos esperados para su edad y condición.
              </p>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Recomendaciones</h3>
            <ul className="space-y-2 text-slate-700">
              <li>• Continuar con rehabilitación pulmonar</li>
              <li>• Aumentar gradualmente la actividad física</li>
              <li>• Seguimiento en 3 meses</li>
              <li>• Evaluar oxígeno suplementario en próxima caminata si síntomas persisten</li>
            </ul>
          </Card>

          <div className="flex gap-4">
            <Button variant="primary" className="!bg-slate-900 hover:!bg-slate-800">
              Guardar Reporte
            </Button>
            {currentTest?.status === 'completada' && (
              <Button
                variant="secondary"
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf || !currentTest?.id}
              >
                {isGeneratingPdf ? 'Generando PDF...' : 'Generar PDF'}
              </Button>
            )}
            <Button variant="outline">
              Imprimir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
