import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const { user } = useAuth();
  const { createTest, isLoading } = useTest();
  const appliedPrefillRef = useRef(false);

  type PrefillPatientData = {
    pacienteId?: string;
    nombreCompleto?: string;
    edad?: number;
    altura?: number;
    sexo?: 'M' | 'F' | 'O';
    raza?: string;
    peso?: number;
    tipoCirugia?: string;
  };

  const prefillPatient = ((location.state as { prefillPatient?: PrefillPatientData } | null)?.prefillPatient) || null;

  const buildPatientId = () => {
    const explicitId = values.idPaciente?.trim();
    if (explicitId) {
      return explicitId;
    }

    const normalizedName = values.nombreCompleto.trim().toLowerCase().replace(/\s+/g, '-');
    const normalizedSex = values.sexo.toLowerCase();
    const normalizedRaza = (values.raza || 'sin-raza').trim().toLowerCase().replace(/\s+/g, '-');
    return `patient-${normalizedName}-${values.edad}-${values.altura}-${normalizedSex}-${normalizedRaza}`;
  };

  const { values, errors, touched, handleChange, handleBlur, resetForm, setFieldValue } =
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

  useEffect(() => {
    if (!prefillPatient || appliedPrefillRef.current) return;

    if (prefillPatient.pacienteId) setFieldValue('idPaciente', prefillPatient.pacienteId);
    if (prefillPatient.nombreCompleto) setFieldValue('nombreCompleto', prefillPatient.nombreCompleto);
    if (typeof prefillPatient.edad === 'number') setFieldValue('edad', prefillPatient.edad);
    if (typeof prefillPatient.altura === 'number') setFieldValue('altura', prefillPatient.altura);
    if (typeof prefillPatient.peso === 'number' && prefillPatient.peso > 0) setFieldValue('peso', prefillPatient.peso);
    if (prefillPatient.sexo) setFieldValue('sexo', prefillPatient.sexo);
    if (typeof prefillPatient.raza === 'string') setFieldValue('raza', prefillPatient.raza);
    if (prefillPatient.tipoCirugia) setFieldValue('tipoCirugia', prefillPatient.tipoCirugia as TipoEnfermedadPulmonar);

    appliedPrefillRef.current = true;
  }, [prefillPatient, setFieldValue]);


    
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
        pacienteId: buildPatientId(),
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
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-3">Nueva evaluación</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Nueva Prueba 6MWT</h1>
          <p className="text-slate-300">
            Bienvenido, {user?.nombre || 'Doctor'}. Registra la información clínica para iniciar la caminata.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
              <form onSubmit={handleStartTest} className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Información del Paciente</h2>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sexo</label>
                    <select
                      name="sexo"
                      value={values.sexo}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Presión Sanguínea Inicial (Ej: 120/80)"
                    name="presionSanguineaInicial"
                    value={values.presionSanguineaInicial || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="120/80 mmHg"
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Oxígeno Suplementario</label>
                    <select
                      name="oxigenoSupplementario"
                      value={values.oxigenoSupplementario}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
                    >
                      <option value="No">No</option>
                      <option value="Si">Sí</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Enfermedad Pulmonar</label>
                    <select
                      name="tipoCirugia"
                      value={values.tipoCirugia}
                      onChange={handleChange}
                      className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
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
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm text-slate-800">
                      <strong>Días post-operatorio:</strong> {daysPostOp} días
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones Previas (opcional)</label>
                  <textarea
                    name="observacionesPrevias"
                    value={values.observacionesPrevias}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Ej: Paciente en buen estado general, sin síntomas previos..."
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  />
                </div>

                <Button type="submit" variant="primary" fullWidth className="!bg-slate-900 hover:!bg-slate-800">
                  Iniciar Prueba
                </Button>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Información Útil</h3>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-700">Duración de Prueba</p>
                    <p className="text-slate-600">
                      {TEST_DURATION_SECONDS / 60} minutos (extensible 2 min más)
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700">Datos Capturados</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      <li>Frecuencia cardíaca (BPM)</li>
                      <li>Saturación O2 (%)</li>
                      <li>Pasos y distancia</li>
                      <li>Alertas en tiempo real</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700">Post-Prueba</p>
                    <p className="text-slate-600">
                      Reporte automático con gráficos, estadísticas y opciones de exportación.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};