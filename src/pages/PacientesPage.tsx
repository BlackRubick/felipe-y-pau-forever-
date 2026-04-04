import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/common';
import testService from '../services/testService';
import { Test } from '../types';

interface PatientRecord {
  key: string;
  nombre: string;
  edad: number;
  sexo: string;
  altura: number;
  peso?: number;
  raza?: string;
  numeroTests: number;
  ultimaFecha: string;
  diagnostico: string;
  basePatientId: string;
  testIds: string[];
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
};

const buildPatients = (tests: Test[]): PatientRecord[] => {
  const patientsMap = new Map<string, {
    tests: Test[];
    basePatientId: string;
    nombre: string;
    edad: number;
    sexo: string;
    altura: number;
    peso?: number;
    raza?: string;
    diagnostico: string;
  }>();

  tests
    .filter((test) => test.status !== 'cancelada')
    .forEach((test) => {
      const key =
        test.pacienteId?.trim().toLowerCase() ||
        test.testConfig.pacienteId?.trim().toLowerCase() ||
        test.testConfig.idPaciente?.trim().toLowerCase() ||
        test.testConfig.pacienteNombre.trim().toLowerCase();
      if (!key) return;

      if (!patientsMap.has(key)) {
        patientsMap.set(key, {
          tests: [],
          basePatientId: test.testConfig.pacienteId,
          nombre: test.testConfig.pacienteNombre,
          edad: test.testConfig.pacienteEdad,
          sexo: test.testConfig.sexo === 'M' ? 'Masculino' : test.testConfig.sexo === 'F' ? 'Femenino' : 'Otro',
          altura: test.testConfig.pacienteAltura,
          peso: test.testConfig.peso,
          raza: test.testConfig.raza,
          diagnostico: test.testConfig.tipoCirugia,
        });
      }

      const patient = patientsMap.get(key)!;
      patient.tests.push(test);
    });

  return Array.from(patientsMap.entries()).map(([key, data]) => ({
    key,
    nombre: data.nombre,
    edad: data.edad,
    sexo: data.sexo,
    altura: data.altura,
    peso: data.peso,
    raza: data.raza,
    numeroTests: data.tests.length,
    ultimaFecha: formatDate(data.tests[data.tests.length - 1]?.createdAt || data.tests[data.tests.length - 1]?.startTime || ''),
    diagnostico: data.diagnostico,
    basePatientId: data.basePatientId || key,
    testIds: data.tests.map((test) => test.id),
  }));
};

export const PacientesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState('');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const apiTests = await testService.getAllTests();
      setPatients(buildPatients(apiTests));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const patientsFiltrados = useMemo(
    () => patients.filter(
      (p) =>
        p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        p.diagnostico.toLowerCase().includes(filtro.toLowerCase())
    ),
    [patients, filtro]
  );

  const handleStartNewTest = async (patient: PatientRecord) => {
    const result = await Swal.fire({
      title: 'Iniciar nueva prueba',
      text: `¿Quieres iniciar una nueva prueba para ${patient.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
    });

    if (result.isConfirmed) {
      navigate('/nueva-prueba', {
        state: {
          prefillPatient: {
            pacienteId: patient.basePatientId,
            nombreCompleto: patient.nombre,
            edad: patient.edad,
            altura: patient.altura,
            sexo: patient.sexo === 'Masculino' ? 'M' : patient.sexo === 'Femenino' ? 'F' : 'O',
            raza: patient.raza || '',
            peso: patient.peso || 0,
            tipoCirugia: patient.diagnostico,
          },
        },
      });
    }
  };

  const handleEditPatient = async (patient: PatientRecord) => {
    const result = await Swal.fire({
      title: `Editar a ${patient.nombre}`,
      html: `
        <div style="display:grid; gap:12px; text-align:left;">
          <div>
            <label for="patient-name" style="display:block; margin-bottom:6px; font-size:14px; color:#334155;">Nombre</label>
            <input id="patient-name" class="swal2-input" style="margin:0; width:100%;" value="${patient.nombre.replace(/"/g, '&quot;')}" />
          </div>
          <div>
            <label for="patient-age" style="display:block; margin-bottom:6px; font-size:14px; color:#334155;">Edad</label>
            <input id="patient-age" type="number" class="swal2-input" style="margin:0; width:100%;" value="${patient.edad}" />
          </div>
          <div>
            <label for="patient-height" style="display:block; margin-bottom:6px; font-size:14px; color:#334155;">Altura (cm)</label>
            <input id="patient-height" type="number" class="swal2-input" style="margin:0; width:100%;" value="${patient.altura}" />
          </div>
          <div>
            <label for="patient-sex" style="display:block; margin-bottom:6px; font-size:14px; color:#334155;">Sexo</label>
            <select id="patient-sex" class="swal2-select" style="margin:0; width:100%; height:42px; border:1px solid #d1d5db; border-radius:0.375rem; padding:0 0.75rem;">
              <option value="M" ${patient.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
              <option value="F" ${patient.sexo === 'Femenino' ? 'selected' : ''}>Femenino</option>
              <option value="O" ${patient.sexo === 'Otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>
          <div>
            <label for="patient-raza" style="display:block; margin-bottom:6px; font-size:14px; color:#334155;">Raza</label>
            <input id="patient-raza" class="swal2-input" style="margin:0; width:100%;" value="${(patient.raza || '').replace(/"/g, '&quot;')}" />
          </div>
          <div>
            <label for="patient-diagnosis" style="display:block; margin-bottom:6px; font-size:14px; color:#334155;">Diagnóstico</label>
            <input id="patient-diagnosis" class="swal2-input" style="margin:0; width:100%;" value="${patient.diagnostico.replace(/"/g, '&quot;')}" />
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const nombre = (document.getElementById('patient-name') as HTMLInputElement | null)?.value.trim();
        const edad = Number((document.getElementById('patient-age') as HTMLInputElement | null)?.value);
        const altura = Number((document.getElementById('patient-height') as HTMLInputElement | null)?.value);
        const sexo = (document.getElementById('patient-sex') as HTMLSelectElement | null)?.value as 'M' | 'F' | 'O';
        const raza = (document.getElementById('patient-raza') as HTMLInputElement | null)?.value.trim();
        const diagnostico = (document.getElementById('patient-diagnosis') as HTMLInputElement | null)?.value.trim();

        if (!nombre) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return;
        }

        if (!edad || edad < 1 || edad > 120) {
          Swal.showValidationMessage('Ingresa una edad válida');
          return;
        }

        if (!altura || altura < 50 || altura > 250) {
          Swal.showValidationMessage('Ingresa una altura válida');
          return;
        }

        if (!diagnostico) {
          Swal.showValidationMessage('El diagnóstico es obligatorio');
          return;
        }

        return { nombre, edad, altura, sexo, raza, diagnostico };
      },
    });

    if (!result.isConfirmed || !result.value) return;

    setIsSaving(true);
    try {
      const bulk = await testService.updatePatientAcrossTests(patient.basePatientId, {
        nombreCompleto: result.value.nombre,
        edad: result.value.edad,
        altura: result.value.altura,
        sexo: result.value.sexo,
        raza: result.value.raza || undefined,
        enfermedadPulmonar: result.value.diagnostico,
      });

      // Respaldo para datos heredados sin paciente_id consistente.
      if (!bulk.updated) {
        await Promise.all(
          patient.testIds.map((testId) =>
            testService.updateTest(testId, {
              paciente: {
                id: patient.basePatientId,
                nombreCompleto: result.value.nombre,
                edad: result.value.edad,
                altura: result.value.altura,
                peso: patient.peso,
                sexo: result.value.sexo,
                raza: result.value.raza || undefined,
              } as any,
              enfermedadPulmonar: result.value.diagnostico as any,
            } as any)
          )
        );
      }

      await loadPatients();
      await Swal.fire({
        icon: 'success',
        title: 'Paciente actualizado',
        text: 'Los datos se guardaron correctamente',
        confirmButtonColor: '#0f172a',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'No se pudo actualizar el paciente',
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePatient = async (patient: PatientRecord) => {
    const result = await Swal.fire({
      title: 'Eliminar paciente',
      text: `¿Quieres eliminar a ${patient.nombre}? Esto cancelará sus pruebas registradas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) return;

    setIsSaving(true);
    try {
      await Promise.all(patient.testIds.map((testId) => testService.deleteTest(testId)));
      await loadPatients();
      await Swal.fire({
        icon: 'success',
        title: 'Paciente eliminado',
        text: 'Se cancelaron las pruebas asociadas',
        confirmButtonColor: '#0f172a',
      });
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'No se pudo eliminar el paciente',
        confirmButtonColor: '#0f172a',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
          <div className="flex items-center justify-between gap-4 flex-wrap">
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
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Altura</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Diagnóstico</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-900">Pruebas</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-900">Última Prueba</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patientsFiltrados.map((patient) => (
                    <tr
                      key={patient.key}
                      onClick={() => handleStartNewTest(patient)}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-900 font-medium">{patient.nombre}</td>
                      <td className="px-4 py-3 text-center text-slate-900">{patient.edad}</td>
                      <td className="px-4 py-3 text-slate-600">{patient.sexo}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{patient.altura} cm</td>
                      <td className="px-4 py-3 text-slate-600">{patient.diagnostico}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-900 font-semibold rounded-full">
                          {patient.numeroTests}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{patient.ultimaFecha}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="text-xs px-3 py-2"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditPatient(patient);
                            }}
                            disabled={isSaving}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            className="text-xs px-3 py-2 !bg-slate-700 hover:!bg-slate-600 text-white"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeletePatient(patient);
                            }}
                            disabled={isSaving}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
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
