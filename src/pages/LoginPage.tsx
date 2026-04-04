
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useForm } from '../hooks';
import { Button, Input, Card } from '../components/common';
import { validateEmail } from '../utils/validation';
import { LoginFormData } from '../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { error: notificationError } = useNotification();
  const [localError, setLocalError] = useState<string | null>(null);

  const { values, errors, touched, handleChange, handleBlur, resetForm } =
    useForm<LoginFormData>({
      email: '',
      password: '',
      recuerdame: false,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!values.email || !validateEmail(values.email)) {
      setLocalError('Por favor ingresa un email válido');
      return;
    }

    if (!values.password) {
      setLocalError('Por favor ingresa tu contraseña');
      return;
    }

    try {
      await login(values);
      resetForm();
      navigate('/nueva-prueba');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en login';
      setLocalError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        <section className="relative bg-slate-900 text-slate-100 p-8 sm:p-10 lg:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.12),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(30,41,59,0.55),transparent_45%)]" />
          <div className="relative z-10 space-y-10">
            <div>
              <p className="text-xs tracking-[0.25em] uppercase text-slate-400 mb-4">
                Plataforma Clínica
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
                Monitor Clínico 6MWT
              </h1>
              <p className="mt-4 text-slate-300 max-w-md">
                Gestión centralizada de pruebas de caminata, seguimiento en tiempo real y evaluación clínica.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-700/70 bg-slate-800/50 p-4">
                <p className="text-sm text-slate-200 font-medium">Acceso Seguro</p>
                <p className="text-sm text-slate-400 mt-1">Sesión cifrada con control de autenticación clínica.</p>
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-800/50 p-4">
                <p className="text-sm text-slate-200 font-medium">Monitoreo Continuo</p>
                <p className="text-sm text-slate-400 mt-1">Visualización de métricas cardiorrespiratorias y evolución de la prueba.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 sm:p-10 lg:p-14">
          <Card className="w-full shadow-none border border-slate-200" padding="lg">
            <div className="space-y-7">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Iniciar sesión</h2>
                <p className="text-slate-500 text-sm mt-2">Ingresa con tus credenciales profesionales.</p>
              </div>

              {localError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {localError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="tu@email.com"
                  error={touched.email && errors.email ? 'Email inválido' : undefined}
                  className="h-11 border-slate-300 focus:ring-slate-800"
                />

                <Input
                  label="Contraseña"
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••••"
                  error={touched.password && errors.password ? 'Requerido' : undefined}
                  className="h-11 border-slate-300 focus:ring-slate-800"
                />

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="recuerdame"
                    checked={values.recuerdame || false}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                  />
                  <span className="text-sm text-slate-700">Recuérdame</span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                  className="!bg-slate-900 hover:!bg-slate-800"
                >
                  Iniciar Sesión
                </Button>
              </form>

            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};
