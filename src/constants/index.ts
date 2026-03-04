export const TEST_DURATION_SECONDS = 360;
export const EXTENDED_DURATION_SECONDS = 120;

export const FC_NORMAL_MIN = 60;
export const FC_NORMAL_MAX = 100;
export const FC_ELEVATED = 120;
export const FC_CRITICAL = 140;

export const SPO2_NORMAL_MIN = 95;
export const SPO2_WARNING = 90;
export const SPO2_CRITICAL = 85;

export const COLORS = {
  primary: '#1e40af',
  secondary: '#059669',
  accent: '#f97316',
  danger: '#dc2626',
  warning: '#eab308',
  success: '#22c55e',
  info: '#0ea5e9',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textLight: '#64748b',
};

export const SURGERY_TYPE_LABELS: Record<string, string> = {
  asma: 'Asma',
  epoc: 'EPOC (Enfermedad Pulmonar Obstructiva Crónica)',
  fibrosis_pulmonar: 'Fibrosis Pulmonar Idiopática',
  neumonía: 'Neumonía',
  enfisema: 'Enfisema',
  bronquitis_crónica: 'Bronquitis Crónica',
  tuberculosis: 'Tuberculosis',
  apnea_del_sueño: 'Apnea del Sueño',
  otra: 'Otra Enfermedad Pulmonar',
};

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  medico: 'Médico',
  enfermero: 'Enfermero',
  paciente: 'Paciente',
};

export const TEST_STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  pausada: 'Pausada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

export const ITEMS_PER_PAGE = 10;
export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

export const ALERT_MESSAGES = {
  fc_muy_alta: 'Frecuencia cardíaca muy elevada',
  fc_elevada: 'Frecuencia cardíaca elevada',
  spo2_bajo: 'Saturación de oxígeno baja',
  spo2_muy_bajo: 'Saturación de oxígeno crítica',
  perdida_conexion: 'Pérdida de conexión con dispositivo',
  latencia_alta: 'Latencia de conexión alta',
  arritmia: 'Posible arritmia detectada',
  caida_abrupta: 'Caída abrupta de valores',
};

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  TESTS: '/tests',
  TEST_DETAIL: '/tests/:id',
  TEST_READINGS: '/tests/:id/readings',
  TEST_STATISTICS: '/tests/:id/statistics',
  TEST_FINALIZE: '/tests/:id/finalize',
  TEST_PAUSE: '/tests/:id/pause',
  TEST_RESUME: '/tests/:id/resume',
  TEST_CANCEL: '/tests/:id/cancel',

  REPORT_PDF: '/tests/:id/report/pdf',
  REPORT_CSV: '/tests/:id/report/csv',

  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/change-password',
};

export const WS_EVENTS = {
  READING: 'reading',
  STATUS: 'status',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
};

export const DEMO_PATIENT = {
  nombreCompleto: 'Juan Pérez García',
  edad: 45,
  altura: 170,
  sexo: 'M',
  tipoCirugia: 'epoc',
  fechaOperacion: '2026-02-23',
  observacionesPrevias: 'Paciente en buen estado general, EPOC leve',
};

export const FEATURES = {
  DEMO_MODE: true,
  EXPORT_PDF: true,
  EXPORT_CSV: true,
  EXPORT_EMAIL: false,
  WEBSOCKET: true,
  SYNC_CLOUD: false,
};

export const TIMEOUTS = {
  TOAST_DURATION: 4000,
  MODAL_ANIMATION: 300,
  DEBOUNCE: 500,
  API_TIMEOUT: 30000,
  WS_RECONNECT_DELAY: 3000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_HEARTBEAT_INTERVAL: 30000,
};

export const BREAKPOINTS = {
  XS: 320,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  MODAL: 40,
  POPOVER: 30,
  TOOLTIP: 50,
  NOTIFICATION: 60,
};
