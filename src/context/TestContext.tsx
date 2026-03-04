// ============================================================================
// TEST CONTEXT - Manejo de pruebas y monitoreo
// ============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Test, TestConfig, VitalReading, Alert, TestStatus } from '../types';
import testService from '../services/testService';

interface TestContextType {
  currentTest: Test | null;
  isLoading: boolean;
  error: string | null;
  readings: VitalReading[];
  alerts: Alert[];

  // Acciones
  createTest: (config: TestConfig) => Promise<Test>;
  loadTest: (testId: string) => Promise<void>;
  updateCurrentTest: (data: Partial<Test>) => void;
  addReading: (reading: VitalReading) => void;
  addAlert: (alert: Alert) => void;
  pauseTest: () => Promise<void>;
  resumeTest: () => Promise<void>;
  finalizeTest: () => Promise<void>;
  cancelTest: () => Promise<void>;
  clearTest: () => void;
  clearError: () => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const TestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const createTest = useCallback(async (config: TestConfig) => {
    setIsLoading(true);
    setError(null);
    setReadings([]);
    setAlerts([]);

    try {
      const test = await testService.createTest(config);
      setCurrentTest(test);
      return test;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear prueba';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTest = useCallback(async (testId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const test = await testService.getTest(testId);
      setCurrentTest(test);
      setReadings(test.readings);
      setAlerts(test.alerts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar prueba';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCurrentTest = useCallback((data: Partial<Test>) => {
    setCurrentTest((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  const addReading = useCallback((reading: VitalReading) => {
    setReadings((prev) => [...prev, reading]);
    if (currentTest) {
      setCurrentTest((prev) =>
        prev ? { ...prev, readings: [...prev.readings, reading] } : null
      );
    }
  }, [currentTest]);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [...prev, alert]);
    if (currentTest) {
      setCurrentTest((prev) =>
        prev ? { ...prev, alerts: [...prev.alerts, alert] } : null
      );
    }
  }, [currentTest]);

  const pauseTest = useCallback(async () => {
    if (!currentTest) return;

    try {
      const updated = await testService.pauseTest(currentTest.id);
      setCurrentTest(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al pausar';
      setError(message);
      throw err;
    }
  }, [currentTest]);

  const resumeTest = useCallback(async () => {
    if (!currentTest) return;

    try {
      const updated = await testService.resumeTest(currentTest.id);
      setCurrentTest(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al reanudar';
      setError(message);
      throw err;
    }
  }, [currentTest]);

  const finalizeTest = useCallback(async () => {
    if (!currentTest) return;

    try {
      const updated = await testService.finalizeTest(currentTest.id);
      setCurrentTest(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al finalizar';
      setError(message);
      throw err;
    }
  }, [currentTest]);

  const cancelTest = useCallback(async () => {
    if (!currentTest) return;

    try {
      const updated = await testService.cancelTest(currentTest.id);
      setCurrentTest(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cancelar';
      setError(message);
      throw err;
    }
  }, [currentTest]);

  const clearTest = useCallback(() => {
    setCurrentTest(null);
    setReadings([]);
    setAlerts([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: TestContextType = {
    currentTest,
    isLoading,
    error,
    readings,
    alerts,
    createTest,
    loadTest,
    updateCurrentTest,
    addReading,
    addAlert,
    pauseTest,
    resumeTest,
    finalizeTest,
    cancelTest,
    clearTest,
    clearError,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};

/**
 * Hook para usar el contexto de pruebas
 */
export const useTest = (): TestContextType => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest debe usarse dentro de TestProvider');
  }
  return context;
};
