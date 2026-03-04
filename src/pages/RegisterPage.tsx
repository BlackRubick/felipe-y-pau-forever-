
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useForm } from '../hooks';
import { Button, Input, Card } from '../components/common';
import { validateEmail, validatePassword, validatePasswordMatch } from '../utils/validation';
import { RegisterFormData, UserRole } from '../types';
import { USER_ROLE_LABELS } from '../constants';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { error: notificationError } = useNotification();
  const [localError, setLocalError] = useState<string | null>(null);

  const { values, errors, touched, handleChange, handleBlur, resetForm } =
    useForm<RegisterFormData>({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: '',
      rol: UserRole.MEDICO,
      institucion: '',
    });

  const passwordValidation = validatePassword(values.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!values.nombre || !values.apellido) {
      setLocalError('Por favor completa nombre y apellido');
      return;
    }

    if (!validateEmail(values.email)) {
      setLocalError('Email inválido');
      return;
    }

    if (!passwordValidation.isValid) {
      setLocalError(`Contraseña débil: ${passwordValidation.errors.join(', ')}`);
      return;
    }

    if (!validatePasswordMatch(values.password, values.confirmPassword)) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (!values.institucion) {
      setLocalError('Por favor ingresa tu institución');
      return;
    }

    try {
      await register(values);
      resetForm();
      navigate('/nueva-prueba');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en registro';
      setLocalError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Crear Nueva Cuenta
            </h1>
            <p className="text-gray-600 text-sm">
              Regístrate en Monitor Clínico 6MWT
            </p>
          </div>

          
          {localError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {localError}
            </div>
          )}

          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nombre"
                type="text"
                name="nombre"
                value={values.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Juan"
              />
              <Input
                label="Apellido"
                type="text"
                name="apellido"
                value={values.apellido}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="García"
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="tu@email.com"
            />

            <Input
              label="Institución/Hospital"
              type="text"
              name="institucion"
              value={values.institucion}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Hospital Central"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuario
              </label>
              <select
                name="rol"
                value={values.rol}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {USER_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
              helperText="Mín. 8 caracteres, mayúscula, número, especial"
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Registrarse
            </Button>
          </form>

          
          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};
