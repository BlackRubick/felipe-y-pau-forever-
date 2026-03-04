import React from 'react';
import { useTestTab } from '../../context/TestTabContext';

export const TestTabs: React.FC = () => {
  const { activeTab, setActiveTab } = useTestTab();

  return (
    <div className="bg-blue-50 border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'patient'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-blue-600'
            }`}
          >
            Datos del Paciente
          </button>
          <button
            onClick={() => setActiveTab('device')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'device'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-blue-600'
            }`}
          >
            Dispositivo
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'demo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-700 hover:text-blue-600'
            }`}
          >
            Modo Demo
          </button>
        </div>
      </div>
    </div>
  );
};
