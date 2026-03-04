// ============================================================================
// LOGIN PAGE
// ============================================================================

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

    // Validar
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Monitor Clínico 6MWT
            </h1>
            <p className="text-gray-600">Prueba de Caminata de 6 Minutos</p>
          </div>

          {/* Error Message */}
          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="tu@email.com"
              error={touched.email && errors.email ? 'Email inválido' : undefined}
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
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="recuerdame"
                checked={values.recuerdame || false}
                onChange={handleChange}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Recuérdame</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Links */}
          <div className="space-y-2 text-center text-sm">
            <p>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
