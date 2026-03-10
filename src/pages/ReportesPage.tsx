import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const CHART_WINDOW_SIZE = 40;

const getRealtimeWsUrl = (testId: string) => {
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const normalizedBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  const wsBase = normalizedBase.replace(/^http/, 'ws');
  return `${wsBase}/ws/tests?testId=${encodeURIComponent(testId)}`;
};

const MiniLineChart: React.FC<{
  title: string;
  colorClass: string;
  stroke: string;
  data: LineChartPoint[];
  unit: string;
}> = ({ title, colorClass, stroke, data, unit }) => {
  const width = 900;
  const height = 220;
  const padding = 28;

  if (!data.length) {
    return (
      <div className={`rounded-lg p-6 ${colorClass}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <div className="h-48 bg-white rounded flex items-center justify-center text-gray-500">
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

  return (
    <div className={`rounded-lg p-6 ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <span className="text-sm font-semibold text-gray-700">
          Último: {last.y} {unit}
        </span>
      </div>

      <div className="bg-white rounded p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          <polyline fill="none" stroke={stroke} strokeWidth="3" points={points} strokeLinejoin="round" strokeLinecap="round" />

          <circle cx={toSvgX(last.x)} cy={toSvgY(last.y)} r="4" fill={stroke} />
        </svg>
      </div>
    </div>
  );
};

interface ReportData {
  id: string;
  paciente: string;
  edad: number;
  sexo: string;
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
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'graficos' || tab === 'observaciones' ? tab : 'resumen');

    const load = async () => {
      setIsLoading(true);
      try {
        const testId = searchParams.get('testId');
        if (testId) {
          const test = await testService.getTest(testId);
          setCurrentTest(test);
          setLastRefresh(new Date());
        } else {
          const all = await testService.getAllTests();
          setCurrentTest(all[0] || null);
          setLastRefresh(new Date());
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== 'graficos' || !currentTest?.id || isWsConnected) return;

    const interval = setInterval(async () => {
      try {
        const updated = await testService.getTest(currentTest.id);
        setCurrentTest(updated);
        setLastRefresh(new Date());
      } catch {
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab, currentTest?.id, isWsConnected]);

  useEffect(() => {
    if (activeTab !== 'graficos' || !currentTest?.id) return;

    const ws = new WebSocket(getRealtimeWsUrl(currentTest.id));

    ws.onopen = () => {
      setIsWsConnected(true);
      setLastRefresh(new Date());
    };

    ws.onclose = () => {
      setIsWsConnected(false);
    };

    ws.onerror = () => {
      setIsWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as BackendRealtimeMessage;

        if (message.type === 'reading' && message.payload) {
          setCurrentTest((prev) => {
            if (!prev || prev.id !== message.testId) return prev;

            const incoming = message.payload;
            const exists = prev.readings.some((r) => r.id === incoming.id);
            if (exists) return prev;

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
      } catch {
      }
    };

    return () => {
      ws.close();
      setIsWsConnected(false);
    };
  }, [activeTab, currentTest?.id]);

  const report = useMemo(() => (currentTest ? toReportData(currentTest) : null), [currentTest]);

  const chartSeries = useMemo(() => {
    const readings = currentTest?.readings || [];
    const series = readings.map((r, i) => ({
      x: typeof r.timestamp === 'number' ? r.timestamp : i,
      fc: r.fc || 0,
      spo2: r.spo2 || 0,
      distancia: r.distancia || 0,
    }));

    const visible = series.slice(-CHART_WINDOW_SIZE);

    return {
      fc: visible.map((p) => ({ x: p.x, y: p.fc })),
      spo2: visible.map((p) => ({ x: p.x, y: p.spo2 })),
      distancia: visible.map((p) => ({ x: p.x, y: p.distancia })),
      totalPoints: series.length,
    };
  }, [currentTest]);

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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Reporte de Prueba 6MWT</h1>
        <p className="text-gray-600">Análisis detallado de la prueba de caminata de 6 minutos</p>
      </div>

      
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{report.paciente}</h2>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Edad</p>
                <p className="font-semibold text-gray-900">{report.edad} años</p>
              </div>
              <div>
                <p className="text-gray-600">Sexo</p>
                <p className="font-semibold text-gray-900">{report.sexo}</p>
              </div>
              <div>
                <p className="text-gray-600">Diagnóstico</p>
                <p className="font-semibold text-gray-900">{report.enfermedad}</p>
              </div>
              <div>
                <p className="text-gray-600">Fecha</p>
                <p className="font-semibold text-gray-900">{report.fecha}</p>
              </div>
            </div>
          </div>
          <div className={`px-6 py-4 rounded-lg ${getResultadoColor(report.resultado)}`}>
            <p className="text-sm font-semibold mb-1">Resultado</p>
            <p className="text-2xl font-bold capitalize">{report.resultado}</p>
          </div>
        </div>
      </Card>

      
      <div className="flex gap-4 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-2 font-medium border-b-2 transition-all ${
            activeTab === 'resumen'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
           Resumen
        </button>
        <button
          onClick={() => setActiveTab('graficos')}
          className={`px-4 py-2 font-medium border-b-2 transition-all ${
            activeTab === 'graficos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Gráficos
        </button>
        <button
          onClick={() => setActiveTab('observaciones')}
          className={`px-4 py-2 font-medium border-b-2 transition-all ${
            activeTab === 'observaciones'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
           Observaciones
        </button>
      </div>

      
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Métricas Principales</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-700">Distancia Recorrida</span>
                <span className="text-2xl font-bold text-blue-600">{report.distancia} m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-gray-700">Velocidad Promedio</span>
                <span className="text-2xl font-bold text-purple-600">{report.velocidadPromedio.toFixed(2)} km/h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-700">Pasos</span>
                <span className="text-2xl font-bold text-green-600">{report.pasos}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700">Duración</span>
                <span className="text-2xl font-bold text-yellow-600">{report.duracion}</span>
              </div>
            </div>
          </Card>

          
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Frecuencia Cardíaca (BPM)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-700">FC en Reposo</span>
                <span className="text-2xl font-bold text-gray-900">{report.fcReposo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-gray-700">FC Promedio</span>
                <span className="text-2xl font-bold text-orange-600">{report.fcPromedio}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-700">FC Máxima</span>
                <span className="text-2xl font-bold text-red-600">{report.fcPico}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                <span className="text-gray-700">FC Recuperación (1 min)</span>
                <span className="text-2xl font-bold text-teal-600">{report.fcRecuperacion}</span>
              </div>
            </div>
          </Card>

          
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Saturación de Oxígeno (%)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                <span className="text-gray-700">SpO₂ Inicial</span>
                <span className="text-2xl font-bold text-cyan-600">{report.spo2Inicial}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-lime-50 rounded-lg">
                <span className="text-gray-700">SpO₂ Promedio</span>
                <span className="text-2xl font-bold text-lime-600">{report.spo2Promedio}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                <span className="text-gray-700">SpO₂ Mínimo</span>
                <span className="text-2xl font-bold text-rose-600">{report.spo2Minimo}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-700">O₂ Suplementario</span>
                <span className="text-xl font-bold text-gray-900">
                  {report.oxigenoSupplementario ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </Card>

          
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Datos Basales</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <span className="text-gray-700">Presión Sanguínea Inicial</span>
                <span className="text-xl font-bold text-indigo-600">{report.presionInicial}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-700">Alertas Detectadas</span>
                <span className="text-2xl font-bold text-yellow-600">{report.alertas}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'graficos' && (
        <Card>
          <div className="space-y-8">
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                {isWsConnected
                  ? 'Tiempo real por WebSocket (sin polling)'
                  : 'WebSocket no disponible. Usando polling de respaldo cada 2s'}
              </p>
              <p className="text-xs text-blue-700">
                {lastRefresh ? `Última actualización: ${lastRefresh.toLocaleTimeString()}` : 'Sin actualizaciones'}
                {' · '}Puntos: {chartSeries.totalPoints}
              </p>
            </div>

            <MiniLineChart
              title="Evolución de Frecuencia Cardíaca"
              colorClass="bg-red-50"
              stroke="#dc2626"
              data={chartSeries.fc}
              unit="BPM"
            />

            <MiniLineChart
              title="Evolución de SpO₂"
              colorClass="bg-cyan-50"
              stroke="#0891b2"
              data={chartSeries.spo2}
              unit="%"
            />

            <MiniLineChart
              title="Distancia Acumulada"
              colorClass="bg-emerald-50"
              stroke="#059669"
              data={chartSeries.distancia}
              unit="m"
            />
          </div>
        </Card>
      )}

      {activeTab === 'observaciones' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Hallazgos Clínicos</h3>
            <div className="space-y-3 text-gray-700">
              <p>✓ Paciente completó exitosamente los 6 minutos de caminata</p>
              <p>✓ Distancia recorrida dentro de rangos normales para su grupo de edad</p>
              <p>✓ Respuesta cardiovascular adecuada al ejercicio</p>
              <p>⚠ Leve desaturación mínima (SpO₂ 90%) en minuto 4</p>
              <p>✓ Recuperación cardíaca normal</p>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Observaciones Clínicas</h3>
            <textarea
              className="form-input w-full"
              rows={6}
              placeholder="Observaciones adicionales del médico..."
              defaultValue="Paciente toleró adecuadamente el test. Se observó respiración disnéica leve. Sin síncope. Caminar fue con buena técnica."
            />
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Interpretación</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-900">
                <strong>Resultado: NORMAL</strong>
              </p>
              <p className="text-green-800 text-sm mt-2">
                El paciente mostró una tolerancia normal al ejercicio con valores dentro de los rangos esperados para su edad y condición.
              </p>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recomendaciones</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Continuar con rehabilitación pulmonar</li>
              <li>• Aumentar gradualmente la actividad física</li>
              <li>• Seguimiento en 3 meses</li>
              <li>• Evaluar oxígeno suplementario en próxima caminata si síntomas persisten</li>
            </ul>
          </Card>

          <div className="flex gap-4">
            <Button variant="primary">
              💾 Guardar Reporte
            </Button>
            <Button variant="secondary">
              📥 Descargar PDF
            </Button>
            <Button variant="outline">
              🖨️ Imprimir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
