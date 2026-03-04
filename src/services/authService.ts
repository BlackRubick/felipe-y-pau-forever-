// ============================================================================
// AUTH SERVICE - Gestión de autenticación y sesiones
// ============================================================================

import { User, AuthResponse, LoginFormData, RegisterFormData, UserRole } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Mock data for testing
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'test@example.com': {
    password: 'password123',
    user: {
      id: '1',
      email: 'test@example.com',
      nombre: 'Usuario',
      apellido: 'Test',
      rol: UserRole.PACIENTE,
      institucion: 'Hospital Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      emailVerified: true,
    },
  },
  'doctor@example.com': {
    password: 'password123',
    user: {
      id: '2',
      email: 'doctor@example.com',
      nombre: 'Dr.',
      apellido: 'Ejemplo',
      rol: UserRole.MEDICO,
      institucion: 'Hospital Central',
      especialidad: 'Cardiología',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      emailVerified: true,
    },
  },
};

const generateMockToken = (): string => {
  return 'mock_token_' + Math.random().toString(36).substr(2, 9);
};

class AuthService {
  private tokenKey = 'auth_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'user_data';
  private useMockData = false; // Cambiar a false cuando tengas backend real

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterFormData): Promise<AuthResponse> {
    if (this.useMockData) {
      // Mock: crear usuario de prueba
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        institucion: data.institucion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        emailVerified: false,
      };

      const token = generateMockToken();
      this.setToken(token);
      this.setRefreshToken(token);
      this.setUser(newUser);

      return {
        user: newUser,
        token,
        refreshToken: token,
      };
    }

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en registro');
    }

    const result = await response.json();
    this.setToken(result.token);
    this.setRefreshToken(result.refreshToken);
    this.setUser(result.user);

    return result;
  }

  /**
   * Iniciar sesión
   */
  async login(data: LoginFormData): Promise<AuthResponse> {
    if (this.useMockData) {
      // Mock login
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
      
      const user = MOCK_USERS[data.email];
      
      if (!user || user.password !== data.password) {
        throw new Error('Email o contraseña incorrectos');
      }

      const token = generateMockToken();
      this.setToken(token);
      this.setRefreshToken(token);
      this.setUser(user.user);

      return {
        user: user.user,
        token,
        refreshToken: token,
      };
    }

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error en login' }));
      throw new Error(error.message || error.error || 'Error en login');
    }

    const result = await response.json();
    console.log('✅ Login exitoso, guardando tokens...');
    this.setToken(result.token);
    this.setRefreshToken(result.refreshToken);
    this.setUser(result.user);
    console.log('✅ Token guardado:', result.token ? 'Sí' : 'No');

    return result;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtener token de acceso
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Obtener header de autorización
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    if (!token) {
      console.warn('⚠️ No hay token disponible');
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Renovar token
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token refresh failed');
    }

    const result = await response.json();
    this.setToken(result.token);

    return result.token;
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al solicitar recuperación');
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al cambiar contraseña');
    }
  }

  /**
   * Métodos privados
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}

export default new AuthService();
