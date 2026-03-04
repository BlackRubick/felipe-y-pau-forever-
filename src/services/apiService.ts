import authService from './authService';
import { ApiResponse, ApiError } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  private isRefreshing = false;

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, 'POST', data);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any,
    retry = true
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const authHeader = authService.getAuthHeader();
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
    };

    console.log(`🔵 ${method} ${url}`);
    console.log('📤 Headers:', JSON.stringify(headers, null, 2));

    const config: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && retry && !this.isRefreshing) {
        console.log('🔄 Token expirado, intentando renovar...');
        this.isRefreshing = true;
        
        try {
          await authService.refreshAccessToken();
          this.isRefreshing = false;
          console.log('✅ Token renovado exitosamente');
          return this.request<T>(endpoint, method, data, false);
        } catch (refreshError) {
          this.isRefreshing = false;
          console.error('❌ Error al renovar token:', refreshError);
          authService.logout();
          window.location.href = '/login';
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw this.handleError(error);
      }

      const result = await response.json();

      if (result && typeof result === 'object' && 'success' in result) {
        const apiResponse = result as ApiResponse<T>;
        if (!apiResponse.success) {
          throw this.handleError(apiResponse.error);
        }
        return apiResponse.data as T;
      }

      return result as T;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private handleError(error: any): Error {
    if (error instanceof Error) return error;

    const apiError = error as ApiError;
    return new Error(apiError.message || error?.error || 'Error desconocido en la API');
  }
}

export default new ApiService();
