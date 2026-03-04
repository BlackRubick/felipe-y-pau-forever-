import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button } from '../components/common';
import testService from '../services/testService';
import { Test } from '../types';

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
  const [activeTab, setActiveTab] = useState<'resumen' | 'graficos' | 'observaciones'>('resumen');
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const testId = searchParams.get('testId');
        if (testId) {
          const test = await testService.getTest(testId);
          setCurrentTest(test);
        } else {
          const all = await testService.getAllTests();
          setCurrentTest(all[0] || null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [searchParams]);

  const report = useMemo(() => (currentTest ? toReportData(currentTest) : null), [currentTest]);

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

      {/* Resultado General */}
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

      {/* Tabs */}
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

      {/* Content */}
      {activeTab === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Métricas Principales */}
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

          {/* Frecuencia Cardíaca */}
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

          {/* Saturación de Oxígeno */}
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

          {/* Datos Basales */}
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
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Evolución de Frecuencia Cardíaca</h3>
              <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
                📈 Gráfico simulado - Frecuencia Cardíaca a lo largo del test
                <div className="mt-4 h-40 bg-white rounded flex items-center justify-center">
                  [Gráfico interactivo con Recharts]
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Evolución de SpO₂</h3>
              <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
                📉 Gráfico simulado - Saturación de Oxígeno a lo largo del test
                <div className="mt-4 h-40 bg-white rounded flex items-center justify-center">
                  [Gráfico interactivo con Recharts]
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Distancia Acumulada</h3>
              <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-600">
                📍 Gráfico simulado - Distancia acumulada a lo largo del test
                <div className="mt-4 h-40 bg-white rounded flex items-center justify-center">
                  [Gráfico interactivo con Recharts]
                </div>
              </div>
            </div>
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
