import React from 'react';
import { Card } from '../components/common';

export const PacientesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
          <p className="text-gray-600">
            Aquí podrás ver y gestionar todos tus pacientes.
          </p>
          
          <div className="mt-8 space-y-4">
            <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900">Sin pacientes registrados</h3>
              <p className="text-sm text-gray-600">Agrega pacientes para comenzar</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
