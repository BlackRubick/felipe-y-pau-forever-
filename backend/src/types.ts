export interface User {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: 'admin' | 'medico' | 'enfermero';
  institucion?: string;
  createdAt: Date;
}

export interface Patient {
  id: string;
  nombreCompleto: string;
  idPaciente?: string;
  edad: number;
  raza?: string;
  altura: number;
  peso?: number;
  sexo: 'M' | 'F' | 'O';
}

export interface TestReading {
  id: string;
  timestamp: Date;
  frecuenciaCardiaca: number;
  spo2: number;
  pasos: number;
  distancia: number;
}

export interface Test {
  id: string;
  paciente: Patient;
  medicoResponsable: string;
  fecha: Date;
  numeroCaminata?: number;
  fechaCaminata: Date;
  enfermedadPulmonar: string;
  presionSanguineaInicial?: string;
  oxigenoSupplementario: boolean;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  duracion: number;
  distanciaTotal: number;
  fcPromedio: number;
  spo2Promedio: number;
  alertas: Alert[];
  lecturas: TestReading[];
  observaciones?: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  tipo: 'fc_alta' | 'fc_baja' | 'spo2_baja' | 'caida_abrupta';
  severidad: 'info' | 'warning' | 'critical';
  timestamp: Date;
  valor: number;
  mensaje: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  rol: 'admin' | 'medico' | 'enfermero';
  institucion?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

export interface CreateTestRequest {
  paciente: Patient;
  medicoResponsable: string;
  enfermedadPulmonar: string;
  numeroCaminata?: number;
  fechaCaminata: string;
  presionSanguineaInicial?: string;
  oxigenoSupplementario: boolean;
  observacionesPrevias?: string;
}
