// ============================================================================
// AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: UserRole;
  institucion: string;
  especialidad?: string;
  nroColegido?: string;
  fotoPerfil?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  emailVerified: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  MEDICO = 'medico',
  ENFERMERO = 'enfermero',
  PACIENTE = 'paciente',
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface Patient {
  id: string;
  nombreCompleto: string;
  edad: number;
  altura: number; // en cm
  sexo: 'M' | 'F' | 'O';
  nroHistoriaClinica: string;
  institucion: string;
  fotoPerfil?: string;
  createdAt: string;
  updatedAt: string;
}

export enum TipoEnfermedadPulmonar {
  ASMA = 'asma',
  EPOC = 'epoc',
  FIBROSIS_PULMONAR = 'fibrosis_pulmonar',
  NEUMONÍA = 'neumonía',
  ENFISEMA = 'enfisema',
  BRONQUITIS_CRÓNICA = 'bronquitis_crónica',
  TUBERCULOSIS = 'tuberculosis',
  APNEA_DEL_SUEÑO = 'apnea_del_sueño',
  OTRA = 'otra',
}

// Mantener alias para compatibilidad hacia atrás
export type TipoCirugia = TipoEnfermedadPulmonar;

// ============================================================================
// TEST (6MWT) TYPES
// ============================================================================

export enum TestStatus {
  PENDIENTE = 'pendiente',
  EN_PROGRESO = 'en_progreso',
  PAUSADA = 'pausada',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

export interface TestConfig {
  pacienteId: string;
  idPaciente?: string;
  pacienteNombre: string;
  pacienteEdad: number;
  pacienteAltura: number;
  peso?: number;
  raza?: string;
  sexo: 'M' | 'F' | 'O';
  tipoCirugia: TipoCirugia;
  fechaOperacion: string; // ISO date
  fechaCaminata?: string; // ISO date
  numeroCaminata?: number;
  presionSanguineaInicial?: string;
  oxigenoSupplementario?: boolean;
  observacionesPrevias?: string;
  medicoResponsable: string;
}

export interface VitalReading {
  id: string;
  testId: string;
  fc: number; // Frecuencia cardíaca en BPM
  spo2: number; // Saturación de oxígeno en %
  pasos: number;
  distancia: number; // en metros
  timestamp: number; // ms desde inicio de prueba
  receivedAt: string; // ISO datetime cuando se recibió
}

export interface Test {
  id: string;
  pacienteId: string;
  testConfig: TestConfig;
  status: TestStatus;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime
  duration: number; // en segundos
  readings: VitalReading[];
  alerts: Alert[];
  observacionesClínicas?: string;
  createdBy: string; // user ID
  createdAt: string;
  updatedAt: string;
}

export interface TestStatistics {
  duracionTotal: number; // segundos
  pasosTotal: number;
  distanciaTotal: number; // metros
  velocidadPromedio: number; // m/s
  caloriasEstimadas: number;
  indiceActividad: number; // %

  // FC
  fcPromedio: number;
  fcMinimo: number;
  fcMaximo: number;
  fcIncremento: number;
  fcVariabilidad: number;
  fcEventosCriticos: number;
  fcRecuperacion: 'buena' | 'normal' | 'lenta' | 'critica';

  // SpO2
  spo2Promedio: number;
  spo2Minimo: number;
  spo2Maximo: number;
  spo2Variabilidad: number;
  spo2EventosCriticos: number;
  spo2Estado: 'optimo' | 'normal' | 'bajo' | 'critico';

  // Interpretación
  resultado: 'normal' | 'anormal' | 'critico';
  recomendaciones: string[];
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export enum AlertType {
  FC_MUY_ALTA = 'fc_muy_alta',
  FC_ELEVADA = 'fc_elevada',
  SPO2_BAJO = 'spo2_bajo',
  SPO2_MUY_BAJO = 'spo2_muy_bajo',
  PERDIDA_CONEXION = 'perdida_conexion',
  LATENCIA_ALTA = 'latencia_alta',
  ARRITMIA = 'arritmia',
  CAIDA_ABRUPTA = 'caida_abrupta',
}

export enum AlertSeverity {
  INFO = 'info',
  ADVERTENCIA = 'advertencia',
  CRITICA = 'critica',
}

export interface Alert {
  id: string;
  testId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value?: number;
  timestamp: number; // ms desde inicio
  dismissedAt?: string;
  dismissedBy?: string;
}

// ============================================================================
// DEVICE TYPES
// ============================================================================

export interface DeviceConnection {
  isConnected: boolean;
  ip: string;
  latency: number; // ms
  lastMessage: string; // ISO datetime
  signalQuality: number; // 0-100
  status: 'conectado' | 'desconectado' | 'buscando';
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export interface TestReport {
  test: Test;
  statistics: TestStatistics;
  alerts: Alert[];
  interpretacion: string;
  fechaGeneracion: string;
}

// ============================================================================
// EVENT LOG TYPES
// ============================================================================

export enum EventType {
  PRUEBA_INICIADA = 'prueba_iniciada',
  PRUEBA_PAUSADA = 'prueba_pausada',
  PRUEBA_REANUDADA = 'prueba_reanudada',
  PRUEBA_FINALIZADA = 'prueba_finalizada',
  PRUEBA_CANCELADA = 'prueba_cancelada',
  ALERTA_GENERADA = 'alerta_generada',
  ALERTA_DESCARTADA = 'alerta_descartada',
  CONEXION_PERDIDA = 'conexion_perdida',
  CONEXION_ESTABLECIDA = 'conexion_establecida',
  DATOS_SINCRONIZADOS = 'datos_sincronizados',
}

export interface EventLog {
  id: string;
  testId: string;
  type: EventType;
  message: string;
  timestamp: number; // ms desde inicio
  createdAt: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// PAGINATION & FILTERING
// ============================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TestFilterParams extends PaginationParams {
  pacienteId?: string;
  status?: TestStatus;
  tipoCirugia?: TipoCirugia;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

export interface WebSocketMessage {
  type: 'reading' | 'status' | 'error' | 'ping' | 'pong';
  payload: any;
  timestamp: string;
}

export interface VitalReadingMessage extends WebSocketMessage {
  type: 'reading';
  payload: {
    fc: number;
    spo2: number;
    pasos: number;
    distancia: number;
  };
}

export interface StatusMessage extends WebSocketMessage {
  type: 'status';
  payload: {
    status: 'conectado' | 'desconectado';
    signalQuality: number;
  };
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
  recuerdame?: boolean;
}

export interface RegisterFormData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: UserRole;
  institucion: string;
}

export interface PatientFormData {
  nombreCompleto: string;
  idPaciente?: string;
  numeroCaminata?: number;
  fechaCaminata: string;
  edad: number;
  raza?: string;
  altura: number;
  peso?: number;
  sexo: 'M' | 'F' | 'O';
  presionSanguineaInicial?: string;
  oxigenoSupplementario: 'Si' | 'No';
  tipoCirugia: TipoCirugia;
  fechaOperacion: string;
  observacionesPrevias?: string;
}

export interface TestObservationsData {
  observacionesClínicas: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // ms, 0 = persistent
  action?: {
    label: string;
    onClick: () => void;
  };
}
