import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/common';
import testService from '../services/testService';
import { Test } from '../types';

interface TestRecord {
  id: string;
  paciente: string;
  edad: number;
  enfermedad: string;
  fecha: string;
  duracion: string;
  distancia: number;
  fcPromedio: number;
  spo2Promedio: number;
  estado: 'completada' | 'cancelada' | 'pausada';
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor((seconds || 0) / 60);
  const secs = (seconds || 0) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
};

const toRecord = (test: Test): TestRecord => ({
  id: test.id,
  paciente: test.testConfig.pacienteNombre,
  edad: test.testConfig.pacienteEdad,
  enfermedad: test.testConfig.tipoCirugia,
  fecha: formatDate(test.createdAt || test.startTime),
  duracion: formatDuration(test.duration),
  distancia: test.readings[test.readings.length - 1]?.distancia || 0,
  fcPromedio: Math.round(test.readings.reduce((a, r) => a + (r.fc || 0), 0) / (test.readings.length || 1)),
  spo2Promedio: Math.round(test.readings.reduce((a, r) => a + (r.spo2 || 0), 0) / (test.readings.length || 1)),
  estado: (test.status === 'en_progreso' ? 'pausada' : test.status) as 'completada' | 'cancelada' | 'pausada',
});

export const HistorialPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('');
  const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const apiTests = await testService.getAllTests();
        const mapped = apiTests.map(toRecord);
        setTests(mapped);
        if (mapped.length > 0) setSelectedTest(mapped[0]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const testsFiltrados = useMemo(() => tests.filter(
    (test) =>
      test.paciente.toLowerCase().includes(filtro.toLowerCase()) ||
      test.enfermedad.toLowerCase().includes(filtro.toLowerCase())
  ), [tests, filtro]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'pausada':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Historial de Pruebas</h1>
        <p className="text-gray-600">Revisa todas las pruebas realizadas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <div className="space-y-6">
              {/* Búsqueda */}
              <div>
                <input
                  type="text"
                  placeholder="Buscar por paciente o enfermedad..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="form-input w-full"
                />
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Paciente</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Enfermedad</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900">Fecha</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Duración</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Distancia</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-900">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testsFiltrados.map((test) => (
                      <tr
                        key={test.id}
                        onClick={() => setSelectedTest(test)}
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">{test.paciente}</td>
                        <td className="px-4 py-3 text-gray-600">{test.enfermedad}</td>
                        <td className="px-4 py-3 text-gray-600">{test.fecha}</td>
                        <td className="px-4 py-3 text-center text-gray-900">{test.duracion}</td>
                        <td className="px-4 py-3 text-center font-semibold text-gray-900">
                          {test.distancia} m
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(
                              test.estado
                            )}`}
                          >
                            {test.estado.charAt(0).toUpperCase() + test.estado.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {testsFiltrados.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No se encontraron pruebas</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar - Detalle */}
        <div>
          {selectedTest ? (
            <Card>
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Detalles de la Prueba</h2>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600">Paciente</p>
                    <p className="font-semibold text-gray-900">{selectedTest.paciente}</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Edad</p>
                    <p className="font-semibold text-gray-900">{selectedTest.edad} años</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Enfermedad Pulmonar</p>
                    <p className="font-semibold text-gray-900">{selectedTest.enfermedad}</p>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-gray-600">FC Promedio</p>
                    <p className="font-semibold text-gray-900">{selectedTest.fcPromedio} BPM</p>
                  </div>

                  <div>
                    <p className="text-gray-600">SpO₂ Promedio</p>
                    <p className="font-semibold text-gray-900">{selectedTest.spo2Promedio}%</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Distancia Recorrida</p>
                    <p className="font-semibold text-gray-900">{selectedTest.distancia} metros</p>
                  </div>

                  <div>
                    <p className="text-gray-600">Duración</p>
                    <p className="font-semibold text-gray-900">{selectedTest.duracion}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Button variant="primary" fullWidth onClick={() => navigate(`/reportes?testId=${selectedTest.id}`)}>
                    Ver Reporte
                  </Button>
                  <Button variant="outline" fullWidth>
                    Descargar PDF
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-600">Selecciona una prueba para ver detalles</p>
              </div>
            </Card>
          )}
        </div>
      </div>
      {isLoading && <div className="text-center py-4 text-gray-600">Cargando historial...</div>}
    </div>
  );
};
