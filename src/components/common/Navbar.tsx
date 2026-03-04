import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-700 hover:text-blue-600';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <Link to="/nueva-prueba" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-blue-600">Monitor 6MWT</h1>
          </Link>

          
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/nueva-prueba"
              className={`px-3 py-2 font-medium transition-colors ${isActive('/nueva-prueba')}`}
            >
              Nueva Prueba
            </Link>

            <Link
              to="/historial"
              className={`px-3 py-2 font-medium transition-colors ${isActive('/historial')}`}
            >
              Historial
            </Link>

            <Link
              to="/reportes"
              className={`px-3 py-2 font-medium transition-colors ${isActive('/reportes')}`}
            >
              Reportes
            </Link>

            {user?.rol === 'medico' && (
              <Link
                to="/pacientes"
                className={`px-3 py-2 font-medium transition-colors ${isActive('/pacientes')}`}
              >
                Pacientes
              </Link>
            )}

            <Link
              to="/dispositivo"
              className={`px-3 py-2 font-medium transition-colors ${isActive('/dispositivo')}`}
            >
              Dispositivo
            </Link>
          </div>

          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-gray-700">{user?.nombre}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {user?.rol === 'medico' ? 'Médico' : 'Paciente'}
              </span>
            </div>

            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>

            
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t pt-4">
            <Link
              to="/nueva-prueba"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 rounded font-medium ${
                isActive('/nueva-prueba') ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              Nueva Prueba
            </Link>

            <Link
              to="/historial"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 rounded font-medium ${
                isActive('/historial') ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              Historial
            </Link>

            <Link
              to="/reportes"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 rounded font-medium ${
                isActive('/reportes') ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              Reportes
            </Link>

            {user?.rol === 'medico' && (
              <Link
                to="/pacientes"
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-2 rounded font-medium ${
                  isActive('/pacientes') ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                Pacientes
              </Link>
            )}

            <Link
              to="/dispositivo"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-2 rounded font-medium ${
                isActive('/dispositivo') ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
            >
              Dispositivo
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

