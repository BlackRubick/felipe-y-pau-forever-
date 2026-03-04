# Monitor Clínico - Guía Rápida de Inicio

## ✅ Configuración Completada

El sistema ya está configurado con:

- ✅ Backend compilado y funcionando
- ✅ Base de datos MySQL conectada
- ✅ Usuario admin creado
- ✅ Frontend configurado

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

```bash
./start.sh
```

Este script inicia automáticamente el backend y el frontend.

### Opción 2: Inicio Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm start
```

## 🔐 Credenciales de Acceso

```
Email: admin@hotmail.com
Password: admin123
```

## 🌐 URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

## 📊 Base de Datos

```
Host: localhost
Port: 3306
Usuario: cesar
Password: cesar123
Database: pau
```

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obtener usuario actual

### Tests
- `POST /api/tests` - Crear nuevo test
- `GET /api/tests` - Listar tests
- `GET /api/tests/:id` - Obtener test por ID
- `POST /api/tests/:id/readings` - Agregar lectura
- `POST /api/tests/:id/alerts` - Agregar alerta
- `PUT /api/tests/:id` - Actualizar test
- `PUT /api/tests/:id/finalize` - Finalizar test
- `DELETE /api/tests/:id` - Cancelar test

## 🔧 Configuración ESP32

Para conectar el ESP32, sigue las instrucciones en [ESP32_SETUP.md](ESP32_SETUP.md)

## 📝 Notas Importantes

1. **Primera vez:** El backend crea las tablas automáticamente
2. **Usuarios por defecto:** Se crean 3 usuarios de prueba + el admin
3. **CORS:** Configurado para http://localhost:3000
4. **Tokens JWT:** Expiran en 24 horas

## 🐛 Solución de Problemas

### Backend no inicia
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql

# Verificar credenciales en backend/.env
cat backend/.env
```

### Frontend no conecta con Backend
```bash
# Verificar la variable de entorno
cat .env
# Debe contener: REACT_APP_API_URL=http://localhost:3001/api
```

### Error de puerto ocupado
```bash
# Verificar procesos en puerto 3001
lsof -i :3001
# Matar proceso si es necesario
kill -9 <PID>
```

## 📚 Documentación Adicional

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Configuración detallada del backend
- [ESP32_SETUP.md](ESP32_SETUP.md) - Configuración del dispositivo ESP32
- [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) - Guía de implementación
- [QUICKSTART.md](QUICKSTART.md) - Inicio rápido original

## 🎯 Próximos Pasos

1. Inicia sesión con admin@hotmail.com
2. Crea un nuevo test desde la interfaz
3. Conecta el ESP32 (opcional)
4. Visualiza los datos en tiempo real

## ⚡ Desarrollo

```bash
# Backend (modo desarrollo con hot reload)
cd backend
npm run dev

# Frontend (ya incluye hot reload)
npm start
```

## 📦 Construcción para Producción

```bash
# Backend
cd backend
npm run build

# Frontend
npm run build
```

---

**¿Necesitas ayuda?** Revisa la documentación o contacta al equipo de desarrollo.
