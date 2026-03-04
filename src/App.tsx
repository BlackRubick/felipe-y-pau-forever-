import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, TestProvider, NotificationProvider, TestTabProvider } from './context';
import { NotificationContainer, ProtectedRoute, Navbar } from './components/common';
import { LoginPage, RegisterPage, NewTestPage, HistorialPage, ReportesPage, PacientesPage, DispositivoPage } from './pages';
import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NotificationProvider>
        <AuthProvider>
          <TestProvider>
            <TestTabProvider>
              <div className="App min-h-screen bg-gray-50">
                <Navbar />
                <Routes>
                  
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  
                  <Route
                    path="/nueva-prueba"
                    element={
                      <ProtectedRoute>
                        <NewTestPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/historial"
                    element={
                      <ProtectedRoute>
                        <HistorialPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/reportes"
                    element={
                      <ProtectedRoute>
                        <ReportesPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/monitoreo/:id"
                    element={<Navigate to="/reportes" replace />}
                  />

                  <Route
                    path="/pacientes"
                    element={
                      <ProtectedRoute>
                        <PacientesPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/dispositivo"
                    element={
                      <ProtectedRoute>
                        <DispositivoPage />
                      </ProtectedRoute>
                    }
                  />

                  
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Routes>

                
                <NotificationContainer />
              </div>
            </TestTabProvider>
          </TestProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;
