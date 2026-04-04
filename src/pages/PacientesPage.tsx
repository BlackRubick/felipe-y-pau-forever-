import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/common';
import testService from '../services/testService';
import { Test } from '../types';

interface PatientRecord {
  id: string;
  nombre: string;
  edad: number;
  sexo: string;
  numeroTests: number;
  ultimaFecha: string;
  diagnostico: string;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
};

export const PacientesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const apiTests = await testService.getAllTests();
        
        // Agrupar por paciente único
        const patientsMap = new Map<string, {
          tests: Test[];
          firstName: string;
          edad: number;
          sexo: string;
          diagnostico: string;
        }>();

        apiTests.forEach((test) => {
          const key = test.testConfig.pacienteNombre;
          if (!patientsMap.has(key)) {
            patientsMap.set(key, {
              tests: [],
              firstName: test.testConfig.pacienteNombre,
              edad: test.testConfig.pacienteEdad,
              sexo: test.testConfig.sexo === 'M' ? 'Masculino' : test.testConfig.sexo === 'F' ? 'Femenino' : 'Otro',
              diagnostico: test.testConfig.tipoCirugia,
            });
          }
          const patient = patientsMap.get(key)!;
          patient.tests.push(test);
        });

        const patientsList: PatientRecord[] = Array.from(patientsMap.entries()).map(
          ([nombre, data]) => ({
            id: nombre,
            nombre: data.firstName,
            edad: data.edad,
            sexo: data.sexo,
            numeroTests: data.tests.length,
            ultimaFecha: formatDate(data.tests[data.tests.length - 1]?.createdAt || data.tests[data.tests.length - 1]?.startTime || ''),
            diagnostico: data.diagnostico,
          })
        );

        setPatients(patientsList);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const patientsFiltrados = useMemo(
    () => patients.filter(
      (p) =>
        p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        p.diagnostico.toLowerCase().includes(filtro.toLowerCase())
    ),
    [patients, filtro]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-3">Módulo clínico</p>
        <h1 className="text-3xl font-bold mb-2">Gestión de Pacientes</h1>
        <p className="text-slate-300">
          Administra, consulta y organiza la información de tus pacientes.
        </p>
      </div>

      <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Listado de Pacientes</h2>
            <p className="text-sm text-slate-600">{patientsFiltrados.length} pacientes</p>
          </div>

          <div>
            <input
              type="text"
              placeholder="Buscar por nombre o diagnóstico..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          {!isLoading && patientsFiltrados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Nombre</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Edad</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Sexo</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Diagnóstico</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Pruebas</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Última Prueba</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsFiltrados.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-900 font-medium">{patient.nombre}</td>
                      <td className="px-4 py-3 text-center text-slate-900">{patient.edad}</td>
                      <td className="px-4 py-3 text-slate-600">{patient.sexo}</td>
                      <td className="px-4 py-3 text-slate-600">{patient.diagnostico}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-semibold rounded-full">
                          {patient.numeroTests}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{patient.ultimaFecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <p className="text-slate-600">Cargando pacientes...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No hay pacientes registrados aún</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
