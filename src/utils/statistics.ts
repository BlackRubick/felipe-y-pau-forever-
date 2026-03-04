
import { VitalReading, TestStatistics, Alert, AlertSeverity } from '../types';

export const calculateStats = (readings: VitalReading[]): TestStatistics => {
  if (readings.length === 0) {
    return getEmptyStats();
  }

  const fcs = readings.map((r) => r.fc);
  const spo2s = readings.map((r) => r.spo2);
  const distances = readings.map((r) => r.distancia);
  const steps = readings.map((r) => r.pasos);

  const fcPromedio = fcs.reduce((a, b) => a + b) / fcs.length;
  const fcMinimo = Math.min(...fcs);
  const fcMaximo = Math.max(...fcs);
  const fcIncremento = fcMaximo - fcMinimo;
  const fcVariabilidad = calculateVariability(fcs);
  const fcEventosCriticos = readings.filter((r) => r.fc > 140).length;

  const spo2Promedio = spo2s.reduce((a, b) => a + b) / spo2s.length;
  const spo2Minimo = Math.min(...spo2s);
  const spo2Maximo = Math.max(...spo2s);
  const spo2Variabilidad = calculateVariability(spo2s);
  const spo2EventosCriticos = readings.filter((r) => r.spo2 < 90).length;

  const distanciaTotal = distances[distances.length - 1] || 0;
  const pasosTotal = steps[steps.length - 1] || 0;
  const duracionTotal = readings.length; // in seconds
  const velocidadPromedio = duracionTotal > 0 ? distanciaTotal / duracionTotal : 0;
  const caloriasEstimadas = 50; // Placeholder, calcular según datos reales

  const activeReadings = readings.filter((r) => r.distancia > 0).length;
  const indiceActividad = Math.round((activeReadings / readings.length) * 100);

  const firstHalf = readings.slice(0, Math.floor(readings.length / 2));
  const secondHalf = readings.slice(Math.floor(readings.length / 2));
  const fcFirstHalf = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b.fc, 0) / firstHalf.length : 0;
  const fcSecondHalf = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b.fc, 0) / secondHalf.length : 0;
  const fcRecuperacion = determineRecovery(fcFirstHalf, fcSecondHalf);

  const resultado = determineResult(fcPromedio, spo2Promedio, fcEventosCriticos, spo2EventosCriticos);
  const spo2Estado = determineSpo2State(spo2Promedio, spo2Minimo);
  const recomendaciones = generateRecommendations(resultado, fcPromedio, spo2Promedio);

  return {
    duracionTotal,
    pasosTotal,
    distanciaTotal,
    velocidadPromedio,
    caloriasEstimadas,
    indiceActividad,
    fcPromedio,
    fcMinimo,
    fcMaximo,
    fcIncremento,
    fcVariabilidad,
    fcEventosCriticos,
    fcRecuperacion,
    spo2Promedio,
    spo2Minimo,
    spo2Maximo,
    spo2Variabilidad,
    spo2EventosCriticos,
    spo2Estado,
    resultado,
    recomendaciones,
  };
};

const getEmptyStats = (): TestStatistics => ({
  duracionTotal: 0,
  pasosTotal: 0,
  distanciaTotal: 0,
  velocidadPromedio: 0,
  caloriasEstimadas: 0,
  indiceActividad: 0,
  fcPromedio: 0,
  fcMinimo: 0,
  fcMaximo: 0,
  fcIncremento: 0,
  fcVariabilidad: 0,
  fcEventosCriticos: 0,
  fcRecuperacion: 'normal',
  spo2Promedio: 0,
  spo2Minimo: 0,
  spo2Maximo: 0,
  spo2Variabilidad: 0,
  spo2EventosCriticos: 0,
  spo2Estado: 'normal',
  resultado: 'normal',
  recomendaciones: [],
});

const calculateVariability = (values: number[]): number => {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

const determineRecovery = (fcFirstHalf: number, fcSecondHalf: number): 'buena' | 'normal' | 'lenta' | 'critica' => {
  const difference = fcFirstHalf - fcSecondHalf;

  if (difference > 20) return 'buena';
  if (difference > 10) return 'normal';
  if (difference > 0) return 'lenta';
  return 'critica';
};

const determineResult = (
  fcPromedio: number,
  spo2Promedio: number,
  fcEvents: number,
  spo2Events: number
): 'normal' | 'anormal' | 'critico' => {
  if (fcEvents > 2 || spo2Events > 2) return 'critico';
  if (fcPromedio > 120 || spo2Promedio < 92) return 'anormal';
  return 'normal';
};

const determineSpo2State = (spo2Promedio: number, spo2Minimo: number): 'optimo' | 'normal' | 'bajo' | 'critico' => {
  if (spo2Minimo < 85) return 'critico';
  if (spo2Promedio < 92) return 'bajo';
  if (spo2Promedio < 95) return 'normal';
  return 'optimo';
};

const generateRecommendations = (
  resultado: 'normal' | 'anormal' | 'critico',
  fcPromedio: number,
  spo2Promedio: number
): string[] => {
  const recommendations: string[] = [];

  switch (resultado) {
    case 'normal':
      recommendations.push('Respuesta cardíaca normal');
      recommendations.push('Oxigenación óptima');
      recommendations.push('Continuar con rehabilitación');
      recommendations.push('Próxima prueba: 2 semanas');
      break;
    case 'anormal':
      recommendations.push('Respuesta cardíaca elevada - Monitorear');
      if (spo2Promedio < 92) {
        recommendations.push('Saturación de oxígeno baja');
      }
      recommendations.push('Considerar consulta adicional');
      recommendations.push('Próxima prueba: 1 semana');
      break;
    case 'critico':
      recommendations.push('Respuesta anormal - Consulta médica inmediata');
      recommendations.push('Considerar revisión del plan de rehabilitación');
      recommendations.push('Monitoreo frecuente recomendado');
      break;
  }

  return recommendations;
};

export const checkAlertThresholds = (
  fc: number,
  spo2: number
): { type: string; severity: AlertSeverity; message: string } | null => {
  if (fc > 140) {
    return {
      type: 'fc_muy_alta',
      severity: AlertSeverity.CRITICA,
      message: `Frecuencia cardíaca crítica: ${fc} BPM`,
    };
  }

  if (fc > 120) {
    return {
      type: 'fc_elevada',
      severity: AlertSeverity.ADVERTENCIA,
      message: `Frecuencia cardíaca elevada: ${fc} BPM`,
    };
  }

  if (spo2 < 85) {
    return {
      type: 'spo2_muy_bajo',
      severity: AlertSeverity.CRITICA,
      message: `Saturación de oxígeno crítica: ${spo2}%`,
    };
  }

  if (spo2 < 90) {
    return {
      type: 'spo2_bajo',
      severity: AlertSeverity.ADVERTENCIA,
      message: `Saturación de oxígeno baja: ${spo2}%`,
    };
  }

  return null;
};
