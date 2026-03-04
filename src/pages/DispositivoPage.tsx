import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Card, Button, Input } from '../components/common';
import { DeviceConnection } from '../types';

export const DispositivoPage: React.FC = () => {
  const [deviceIp, setDeviceIp] = useState('192.168.1.100');
  const [isConnecting, setIsConnecting] = useState(false);
  const [device, setDevice] = useState<DeviceConnection>({
    isConnected: false,
    ip: '',
    latency: 0,
    lastMessage: new Date().toISOString(),
    signalQuality: 0,
    status: 'desconectado',
  });

  const handleConnect = async () => {
    if (!deviceIp) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Por favor ingresa la IP del dispositivo',
        confirmButtonColor: '#3085d6',
      });
      return;
    }

    setIsConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setDevice({
        isConnected: true,
        ip: deviceIp,
        latency: Math.floor(Math.random() * 50) + 10,
        lastMessage: new Date().toISOString(),
        signalQuality: Math.floor(Math.random() * 40) + 60,
        status: 'conectado',
      });

      Swal.fire({
        icon: 'success',
        title: '¡Conectado!',
        text: `Dispositivo conectado exitosamente a ${deviceIp}`,
        confirmButtonColor: '#10b981',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo conectar al dispositivo',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setDevice({
      ...device,
      isConnected: false,
      status: 'desconectado',
    });
  };

  const handleCalibrate = async () => {
    if (!device.isConnected) {
      Swal.fire({
        icon: 'info',
        title: 'Dispositivo no conectado',
        text: 'Debes conectar el dispositivo primero',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      Swal.fire({
        icon: 'success',
        title: 'Calibración completada',
        text: 'Dispositivo calibrado correctamente',
        confirmButtonColor: '#10b981',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error en calibración',
        text: 'Error calibrando dispositivo',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTest = async () => {
    if (!device.isConnected) {
      Swal.fire({
        icon: 'info',
        title: 'Dispositivo no conectado',
        text: 'Debes conectar el dispositivo primero',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setIsConnecting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Swal.fire({
        icon: 'success',
        title: 'Prueba exitosa',
        text: 'Prueba de conexión completada exitosamente',
        confirmButtonColor: '#10b981',
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la prueba',
        text: 'Error en la prueba de conexión',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Gestión de Dispositivo</h1>

        
        <Card className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Estado de Conexión</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      device.isConnected ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></div>
                  <span className="text-lg font-semibold text-gray-900">
                    {device.isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">IP del Dispositivo</p>
                <p className="text-lg font-semibold text-gray-900">
                  {device.isConnected ? device.ip : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Latencia</p>
                <p className="text-lg font-semibold text-gray-900">
                  {device.isConnected ? `${device.latency}ms` : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Calidad de Señal</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${device.signalQuality}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {device.signalQuality}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Última comunicación: {new Date(device.lastMessage).toLocaleTimeString()}
            </p>
          </div>
        </Card>

        
        <Card className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Configuración de Conexión</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección IP del Dispositivo
            </label>
            <Input
              type="text"
              value={deviceIp}
              onChange={(e) => setDeviceIp(e.target.value)}
              placeholder="192.168.1.100"
              disabled={device.isConnected}
              className="mb-4"
            />

            <div className="flex gap-2">
              {!device.isConnected ? (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isConnecting ? 'Conectando...' : 'Conectar'}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Desconectar
                </Button>
              )}
            </div>
          </div>
        </Card>

        
        {device.isConnected && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones del Dispositivo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleCalibrate}
                disabled={isConnecting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isConnecting ? 'Calibrando...' : 'Calibrar Dispositivo'}
              </Button>

              <Button
                onClick={handleTest}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isConnecting ? 'Probando...' : 'Prueba de Conexión'}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Consejo:</strong> Calibra el dispositivo antes de realizar cualquier
                prueba para asegurar mediciones precisas.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};