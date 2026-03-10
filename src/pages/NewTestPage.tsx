import React from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useTest } from '../context/TestContext';
import { useForm } from '../hooks';
import { Button, Input, Card, LoadingSpinner } from '../components/common';
import { PatientFormData, TipoEnfermedadPulmonar, TestConfig } from '../types';
import { validateAge, validateHeight, validateDateNotFuture } from '../utils/validation';
import { calculateDaysPostOp } from '../utils/formatting';
import { SURGERY_TYPE_LABELS, TEST_DURATION_SECONDS } from '../constants';

export const NewTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createTest, isLoading } = useTest();

  const { values, errors, touched, handleChange, handleBlur, resetForm } =
    useForm<PatientFormData>({
      nombreCompleto: '',
      idPaciente: '',
      numeroCaminata: 1,
      fechaCaminata: new Date().toISOString().split('T')[0],
      edad: 0,
      raza: '',
      altura: 0,
      peso: 0,
      sexo: 'M',
      presionSanguineaInicial: '',
      oxigenoSupplementario: 'No',
      tipoCirugia: TipoEnfermedadPulmonar.EPOC,
      fechaOperacion: new Date().toISOString().split('T')[0],
      observacionesPrevias: '',
    });

  const ageError =
    touched.edad && values.edad && !validateAge(values.edad)
      ? 'Edad debe estar entre 1 y 120'
      : '';

  const heightError =
    touched.altura && values.altura && !validateHeight(values.altura)
      ? 'Altura debe estar entre 50 y 250 cm'
      : '';

  const dateError =
    touched.fechaOperacion &&
    values.fechaOperacion &&
    !validateDateNotFuture(values.fechaOperacion)
      ? 'La fecha no puede ser en el futuro'
      : '';

  const daysPostOp = calculateDaysPostOp(values.fechaOperacion);

  const handleStartTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!values.nombreCompleto) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingresa el nombre del paciente',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    if (!values.edad || ageError) {
      Swal.fire({
        icon: 'warning',
        title: 'Edad inválida',
        text: 'Por favor ingresa una edad válida',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    if (!values.altura || heightError) {
      Swal.fire({
        icon: 'warning',
        title: 'Altura inválida',
        text: 'Por favor ingresa una altura válida',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    if (!values.fechaOperacion || dateError) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha inválida',
        text: 'Por favor ingresa una fecha válida',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    try {
      const config: TestConfig = {
        pacienteId: `patient-${Date.now()}`,
        idPaciente: values.idPaciente || undefined,
        pacienteNombre: values.nombreCompleto,
        pacienteEdad: values.edad,
        pacienteAltura: values.altura,
        peso: values.peso || undefined,
        raza: values.raza || undefined,
        sexo: values.sexo,
        tipoCirugia: values.tipoCirugia,
        fechaOperacion: values.fechaOperacion,
        fechaCaminata: values.fechaCaminata,
        numeroCaminata: values.numeroCaminata || 1,
        presionSanguineaInicial: values.presionSanguineaInicial || undefined,
        oxigenoSupplementario: values.oxigenoSupplementario === 'Si',
        observacionesPrevias: values.observacionesPrevias,
        medicoResponsable: user?.nombre || 'Unknown',
      };

      const test = await createTest(config);
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Prueba iniciada correctamente',
        confirmButtonColor: '#10b981',
      });
      resetForm();
      navigate(`/reportes?testId=${encodeURIComponent(test.id)}&tab=graficos`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creando prueba';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#ef4444',
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Iniciando prueba..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Nueva Prueba 6MWT</h1>
          <p className="text-gray-600">
            Bienvenido, {user?.nombre || 'Doctor'}. Inicia una nueva prueba de caminata.
          </p>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2">
            <Card>
              <form onSubmit={handleStartTest} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Información del Paciente
                </h2>

                <Input
                  label="Nombre Completo"
                  name="nombreCompleto"
                  value={values.nombreCompleto}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Juan Pérez García"
                  error={
                    touched.nombreCompleto && !values.nombreCompleto
                      ? 'Requerido'
                      : undefined
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="ID del Paciente (Opcional)"
                    name="idPaciente"
                    value={values.idPaciente || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="PAC-2026-001"
                  />
                  <Input
                    label="Número de Caminata"
                    type="number"
                    name="numeroCaminata"
                    value={values.numeroCaminata || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="1"
                  />
                </div>

                <Input
                  label="Fecha de la Caminata"
                  type="date"
                  name="fechaCaminata"
                  value={values.fechaCaminata}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <div className="grid grid-cols-4 gap-4">
                  <Input
                    label="Edad (años)"
                    type="number"
                    name="edad"
                    value={values.edad || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="45"
                    error={ageError}
                  />
                  <Input
                    label="Altura (cm)"
                    type="number"
                    name="altura"
                    value={values.altura || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="170"
                    error={heightError}
                  />
                  <Input
                    label="Peso (kg)"
                    type="number"
                    name="peso"
                    value={values.peso || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="70"
                    step="0.1"
                  />
                  <Input
                    label="Raza"
                    name="raza"
                    value={values.raza || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Latina"
                  />
                  <div>
                    <label className="form-label">Sexo</label>
                    <select
                      name="sexo"
                      value={values.sexo}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Presión Sanguínea Inicial (Ej: 120/80)"
                    name="presionSanguineaInicial"
                    value={values.presionSanguineaInicial || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="120/80 mmHg"
                  />
                  <div>
                    <label className="form-label">Oxígeno Suplementario</label>
                    <select
                      name="oxigenoSupplementario"
                      value={values.oxigenoSupplementario}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Tipo de Enfermedad Pulmonar</label>
                    <select
                      name="tipoCirugia"
                      value={values.tipoCirugia}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      {Object.entries(SURGERY_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {String(label)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Fecha de Operación"
                    type="date"
                    name="fechaOperacion"
                    value={values.fechaOperacion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={dateError}
                  />
                </div>

                {values.fechaOperacion && !dateError && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Días post-operatorio:</strong> {daysPostOp} días
                    </p>
                  </div>
                )}

                <div>
                  <label className="form-label">Observaciones Previas (opcional)</label>
                  <textarea
                    name="observacionesPrevias"
                    value={values.observacionesPrevias}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej: Paciente en buen estado general, sin síntomas previos..."
                    rows={4}
                    className="form-input w-full"
                  />
                </div>

                <Button type="submit" variant="primary" fullWidth>
                  Iniciar Prueba
                </Button>
              </form>
            </Card>
          </div>

          
          <div className="space-y-6">
            
            <Card>
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">Información Útil</h3>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">Duración de Prueba</p>
                    <p className="text-gray-600">
                      {TEST_DURATION_SECONDS / 60} minutos (extensible 2 min más)
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Datos Capturados</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      <li>Frecuencia cardíaca (BPM)</li>
                      <li>Saturación O2 (%)</li>
                      <li>Pasos y distancia</li>
                      <li>Alertas en tiempo real</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-700">Post-Prueba</p>
                    <p className="text-gray-600">
                      Reporte automático con gráficos, estadísticas y opciones de exportación.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            
            <Card>
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900">Requisitos</h3>

                <div className="space-y-2 text-sm">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!values.nombreCompleto}
                      readOnly
                      className="mt-1"
                    />
                    <span
                      className={
                        values.nombreCompleto ? 'text-green-700' : 'text-gray-600'
                      }
                    >
                      Nombre del paciente
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!values.edad && !ageError}
                      readOnly
                      className="mt-1"
                    />
                    <span
                      className={
                        values.edad && !ageError ? 'text-green-700' : 'text-gray-600'
                      }
                    >
                      Edad válida
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!values.altura && !heightError}
                      readOnly
                      className="mt-1"
                    />
                    <span
                      className={
                        values.altura && !heightError ? 'text-green-700' : 'text-gray-600'
                      }
                    >
                      Altura válida
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!values.fechaOperacion && !dateError}
                      readOnly
                      className="mt-1"
                    />
                    <span
                      className={
                        values.fechaOperacion && !dateError
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }
                    >
                      Fecha de operación
                    </span>
                  </label>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};