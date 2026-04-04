import React from 'react';
import { Card } from '../components/common';

export const PacientesPage: React.FC = () => {
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
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Listado</h2>
          <p className="text-slate-600">
            Aquí podrás ver y gestionar todos tus pacientes.
          </p>
          
          <div className="mt-8 space-y-4">
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 transition-shadow hover:shadow-md cursor-pointer">
              <h3 className="font-semibold text-slate-900">Sin pacientes registrados</h3>
              <p className="text-sm text-slate-600">Agrega pacientes para comenzar</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
