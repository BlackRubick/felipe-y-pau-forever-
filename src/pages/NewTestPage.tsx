import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useTest } from '../context/TestContext';
import { useForm } from '../hooks';
import { Button, Input, Card, LoadingSpinner } from '../components/common';
import { PatientFormData, TipoEnfermedadPulmonar, TestConfig } from '../types';
import { validateAge, validateHeight } from '../utils/validation';
import { SURGERY_TYPE_LABELS, TEST_DURATION_SECONDS } from '../constants';
import testService from '../services/testService';

export const NewTestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { createTest, isLoading } = useTest();
  const appliedPrefillRef = useRef(false);
  const [activeTest, setActiveTest] = useState<null | { id: string; startTime: string; duration: number; status: string }>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const formatClock = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
    const toBase36Hash = (input: string) => {
      let hash = 0;
      for (let i = 0; i < input.length; i += 1) {
        hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
      }
      return Math.abs(hash).toString(36);
    };

    const sanitize = (input: string) =>
      input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const explicitId = sanitize(values.idPaciente || '');
    if (explicitId) {
      // tests.paciente_id is VARCHAR(36) in backend DB schema.
      return `patient-${explicitId}`.slice(0, 36);
    }

    const normalizedName = sanitize(values.nombreCompleto || 'sin-nombre');
    const normalizedSex = sanitize(values.sexo || 'o');
    const normalizedRaza = sanitize(values.raza || 'sin-raza');
    const raw = `${normalizedName}-${values.edad}-${values.altura}-${normalizedSex}-${normalizedRaza}`;
    const hash = toBase36Hash(raw);
    const slug = `${normalizedName}-${hash}`.slice(0, 28);
    return `patient-${slug}`.slice(0, 36);
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
      escalaBorg: 0,
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

  useEffect(() => {
    let mounted = true;

    const fetchActiveTest = async () => {
      try {
        const tests = await testService.getAllTests();
        const running = tests
          .filter((t) => t.status === 'en_progreso')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        if (!mounted) return;

        if (running) {
          setActiveTest({
            id: running.id,
            startTime: running.startTime,
            duration: running.duration || 0,
            status: running.status,
          });
        } else {
          setActiveTest(null);
        }
      } catch {
        if (mounted) setActiveTest(null);
      }
    };

    fetchActiveTest();
    const poll = setInterval(fetchActiveTest, 4000);
    const ticker = setInterval(() => setNowMs(Date.now()), 1000);

    return () => {
      mounted = false;
      clearInterval(poll);
      clearInterval(ticker);
    };
  }, []);

  const activeTestProgress = useMemo(() => {
    if (!activeTest) {
      return {
        elapsed: 0,
        remaining: TEST_DURATION_SECONDS,
        progress: 0,
      };
    }

    const startMs = new Date(activeTest.startTime).getTime();
    const elapsedByClock = Number.isFinite(startMs) ? Math.max(0, Math.floor((nowMs - startMs) / 1000)) : 0;
    const elapsed = Math.max(activeTest.duration || 0, elapsedByClock);
    const remaining = Math.max(0, TEST_DURATION_SECONDS - elapsed);
    const progress = Math.min(100, (Math.min(elapsed, TEST_DURATION_SECONDS) / TEST_DURATION_SECONDS) * 100);

    return { elapsed, remaining, progress };
  }, [activeTest, nowMs]);


    
  const ageError =
    touched.edad && values.edad && !validateAge(values.edad)
      ? 'Edad debe estar entre 1 y 120'
      : '';

  const heightError =
    touched.altura && values.altura && !validateHeight(values.altura)
      ? 'Altura debe estar entre 50 y 250 cm'
      : '';

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
        escalaBorg: values.escalaBorg,
        tipoCirugia: values.tipoCirugia,
        fechaOperacion: values.fechaCaminata,
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
      {activeTest && (
        <div className="fixed z-40 right-4 bottom-4 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-sky-200 bg-white/95 backdrop-blur shadow-2xl p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-sky-600 font-semibold">Test activo</p>
              <p className="text-sm font-bold text-slate-900">Cronómetro en progreso</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              En vivo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">Transcurrido</p>
              <p className="text-xl font-bold text-slate-900">{formatClock(activeTestProgress.elapsed)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <p className="text-[11px] text-slate-500">Restante</p>
              <p className="text-xl font-bold text-slate-900">{formatClock(activeTestProgress.remaining)}</p>
            </div>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${activeTestProgress.progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-600">{activeTestProgress.progress.toFixed(1)}% completado</p>
            <button
              type="button"
              onClick={() => navigate(`/reportes?testId=${encodeURIComponent(activeTest.id)}&tab=graficos`)}
              className="text-xs font-semibold text-sky-700 hover:text-sky-900"
            >
              Ver monitoreo
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-3">Nueva evaluación</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Nueva Prueba 6MWT</h1>
          <p className="text-slate-300">
            Bienvenido, {user?.nombre || 'Doctor'}. Registra la información clínica para iniciar la caminata.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border border-slate-200 shadow-lg rounded-2xl" padding="lg">
            <form onSubmit={handleStartTest} className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Información del Paciente</h2>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold mb-1">
                      Escala de Borg
                    </p>
                    <p className="text-sm text-slate-600">
                      0 = reposo, 10 = esfuerzo extremo
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 leading-none">{values.escalaBorg}</p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">/10</p>
                  </div>
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Escala de Borg (0 a 10)</label>
                  <select
                    name="escalaBorg"
                    value={values.escalaBorg}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
                  >
                    {Array.from({ length: 11 }).map((_, index) => (
                      <option key={index} value={index}>
                        {index}
                      </option>
                    ))}
                  </select>
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
                </div>

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
      </div>
    </div>
  );
};