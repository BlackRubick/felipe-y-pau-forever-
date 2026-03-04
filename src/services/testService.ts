// ============================================================================
// TEST SERVICE - Operaciones relacionadas con pruebas 6MWT
// ============================================================================

import apiService from './apiService';
import {
  Test,
  TestConfig,
  TestStatistics,
  VitalReading,
  TestFilterParams,
  PaginatedResponse,
} from '../types';

const mapBackendTestToFrontend = (backendTest: any): Test => {
  const createdAt = backendTest.createdAt ? new Date(backendTest.createdAt).toISOString() : new Date().toISOString();
  const fecha = backendTest.fecha ? new Date(backendTest.fecha).toISOString() : createdAt;

  return {
    id: backendTest.id,
    pacienteId: backendTest.paciente?.id || '',
    testConfig: {
      pacienteId: backendTest.paciente?.id || '',
      idPaciente: backendTest.paciente?.idPaciente,
      pacienteNombre: backendTest.paciente?.nombreCompleto || '',
      pacienteEdad: backendTest.paciente?.edad || 0,
      pacienteAltura: backendTest.paciente?.altura || 0,
      peso: backendTest.paciente?.peso,
      raza: backendTest.paciente?.raza,
      sexo: backendTest.paciente?.sexo || 'M',
      tipoCirugia: backendTest.enfermedadPulmonar || 'otra',
      fechaOperacion: backendTest.fechaCaminata || backendTest.fecha || new Date().toISOString().split('T')[0],
      fechaCaminata: backendTest.fechaCaminata || backendTest.fecha || new Date().toISOString().split('T')[0],
      numeroCaminata: backendTest.numeroCaminata,
      presionSanguineaInicial: backendTest.presionSanguineaInicial,
      oxigenoSupplementario: !!backendTest.oxigenoSupplementario,
      observacionesPrevias: backendTest.observaciones,
      medicoResponsable: backendTest.medicoResponsable || '',
    },
    status: backendTest.estado || 'en_progreso',
    startTime: fecha,
    endTime: undefined,
    duration: backendTest.duracion || 0,
    readings: (backendTest.lecturas || []).map((reading: any) => ({
      id: reading.id,
      testId: backendTest.id,
      fc: reading.frecuenciaCardiaca,
      spo2: reading.spo2,
      pasos: reading.pasos,
      distancia: reading.distancia,
      timestamp: 0,
      receivedAt: reading.timestamp ? new Date(reading.timestamp).toISOString() : new Date().toISOString(),
    })),
    alerts: (backendTest.alertas || []).map((alert: any) => ({
      id: alert.id,
      testId: backendTest.id,
      type: alert.tipo || 'caida_abrupta',
      severity: alert.severidad || 'warning',
      message: alert.mensaje || '',
      value: alert.valor,
      timestamp: 0,
    })),
    observacionesClínicas: backendTest.observaciones,
    createdBy: '',
    createdAt,
    updatedAt: createdAt,
  } as Test;
};

class TestService {
  /**
   * Crear nueva prueba
   */
  async createTest(config: TestConfig): Promise<Test> {
    const payload = {
      paciente: {
        id: config.pacienteId,
        idPaciente: config.idPaciente,
        nombreCompleto: config.pacienteNombre,
        edad: config.pacienteEdad,
        raza: config.raza,
        altura: config.pacienteAltura,
        peso: config.peso,
        sexo: config.sexo,
      },
      medicoResponsable: config.medicoResponsable,
      enfermedadPulmonar: config.tipoCirugia,
      numeroCaminata: config.numeroCaminata,
      fechaCaminata: config.fechaCaminata || config.fechaOperacion,
      presionSanguineaInicial: config.presionSanguineaInicial,
      oxigenoSupplementario: config.oxigenoSupplementario ?? false,
      observacionesPrevias: config.observacionesPrevias,
    };

    const backendTest = await apiService.post<any>('/tests', payload);
    return mapBackendTestToFrontend(backendTest);
  }

  /**
   * Obtener prueba por ID
   */
  async getTest(testId: string): Promise<Test> {
    const backendTest = await apiService.get<any>(`/tests/${testId}`);
    return mapBackendTestToFrontend(backendTest);
  }

  /**
   * Obtener todas las pruebas
   */
  async getAllTests(): Promise<Test[]> {
    const backendTests = await apiService.get<any[]>('/tests');
    return (backendTests || []).map(mapBackendTestToFrontend);
  }

  /**
   * Actualizar prueba
   */
  async updateTest(testId: string, data: Partial<Test>): Promise<Test> {
    const backendTest = await apiService.put<any>(`/tests/${testId}`, data);
    return mapBackendTestToFrontend(backendTest);
  }

  /**
   * Finalizar prueba
   */
  async finalizeTest(testId: string): Promise<Test> {
    return apiService.put<Test>(`/tests/${testId}/finalize`, {});
  }

  /**
   * Pausar prueba
   */
  async pauseTest(testId: string): Promise<Test> {
    return apiService.put<Test>(`/tests/${testId}/pause`, {});
  }

  /**
   * Reanudar prueba
   */
  async resumeTest(testId: string): Promise<Test> {
    return apiService.put<Test>(`/tests/${testId}/resume`, {});
  }

  /**
   * Cancelar prueba
   */
  async cancelTest(testId: string): Promise<Test> {
    return apiService.put<Test>(`/tests/${testId}/cancel`, {});
  }

  /**
   * Agregar lectura vital
   */
  async addReading(testId: string, reading: Omit<VitalReading, 'id' | 'testId' | 'receivedAt'>): Promise<VitalReading> {
    return apiService.post<VitalReading>(`/tests/${testId}/readings`, reading);
  }

  /**
   * Obtener estadísticas de prueba
   */
  async getTestStatistics(testId: string): Promise<TestStatistics> {
    return apiService.get<TestStatistics>(`/tests/${testId}/statistics`);
  }

  /**
   * Listar pruebas con filtros
   */
  async listTests(filters: TestFilterParams): Promise<PaginatedResponse<Test>> {
    const tests = await this.getAllTests();

    const filtered = tests.filter((test) => {
      if (filters.pacienteId && test.pacienteId !== filters.pacienteId) return false;
      if (filters.status && test.status !== filters.status) return false;
      if (filters.tipoCirugia && test.testConfig.tipoCirugia !== filters.tipoCirugia) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const patientName = test.testConfig.pacienteNombre.toLowerCase();
        if (!patientName.includes(term)) return false;
      }
      return true;
    });

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    };
  }

  /**
   * Eliminar prueba
   */
  async deleteTest(testId: string): Promise<void> {
    return apiService.delete<void>(`/tests/${testId}`);
  }

  /**
   * Actualizar observaciones
   */
  async updateObservations(testId: string, observations: string): Promise<Test> {
    return apiService.put<Test>(`/tests/${testId}/observations`, { observacionesClínicas: observations });
  }

  /**
   * Generar reporte PDF
   */
  async generatePDF(testId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/tests/${testId}/report/pdf`,
      {
        method: 'GET',
        headers: {
          ...apiService.constructor.prototype.getAuthHeader?.(),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error generando PDF');
    }

    return response.blob();
  }

  /**
   * Generar reporte CSV
   */
  async generateCSV(testId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/tests/${testId}/report/csv`,
      {
        method: 'GET',
        headers: {
          ...apiService.constructor.prototype.getAuthHeader?.(),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error generando CSV');
    }

    return response.blob();
  }
}

export default new TestService();
