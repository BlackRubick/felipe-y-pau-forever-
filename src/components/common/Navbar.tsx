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

  const isActive = (path: string) => location.pathname === path;

  const navItemClass = (path: string) =>
    isActive(path)
      ? 'relative px-4 py-2 rounded-full text-sm font-semibold text-slate-900 bg-slate-100'
      : 'relative px-4 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-colors';

  const mobileNavItemClass = (path: string) =>
    isActive(path)
      ? 'block px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white'
      : 'block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100';

  const roleLabel =
    user?.rol === 'medico' ? 'Medico' : user?.rol === 'admin' ? 'Admin' : user?.rol === 'enfermero' ? 'Enfermero' : 'Usuario';

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/nueva-prueba" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 text-white flex items-center justify-center shadow-sm">
              <span className="text-sm font-bold">6</span>
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Panel Clinico</p>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">Prueba 6MWT</h1>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
            <Link
              to="/nueva-prueba"
              className={navItemClass('/nueva-prueba')}
            >
              Nueva Prueba
            </Link>

            <Link
              to="/historial"
              className={navItemClass('/historial')}
            >
              Historial
            </Link>

            <Link
              to="/reportes"
              className={navItemClass('/reportes')}
            >
              Reportes
            </Link>

            {user?.rol === 'medico' && (
              <Link
                to="/pacientes"
                className={navItemClass('/pacientes')}
              >
                Pacientes
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <span className="h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                {(user?.nombre || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="text-sm text-slate-700 font-medium max-w-[140px] truncate">{user?.nombre}</span>
              <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-1 rounded-full border border-teal-100">
                {roleLabel}
              </span>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Abrir menu"
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
              className="hidden md:inline-flex px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Salir
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-slate-200 pt-4">
            <div className="px-2 pb-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.nombre}</p>
                <p className="text-xs text-slate-600">{roleLabel}</p>
              </div>
            </div>
            <Link
              to="/nueva-prueba"
              onClick={() => setIsMenuOpen(false)}
              className={mobileNavItemClass('/nueva-prueba')}
            >
              Nueva Prueba
            </Link>

            <Link
              to="/historial"
              onClick={() => setIsMenuOpen(false)}
              className={mobileNavItemClass('/historial')}
            >
              Historial
            </Link>

            <Link
              to="/reportes"
              onClick={() => setIsMenuOpen(false)}
              className={mobileNavItemClass('/reportes')}
            >
              Reportes
            </Link>

            {user?.rol === 'medico' && (
              <Link
                to="/pacientes"
                onClick={() => setIsMenuOpen(false)}
                className={mobileNavItemClass('/pacientes')}
              >
                Pacientes
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="mt-2 w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

