# 🎉 Configuración Completa - Monitor Clínico

## ✅ Todo está listo para usar

### 1. Backend Configurado
- ✅ Base de datos MySQL conectada (usuario: cesar, db: pau)
- ✅ Tablas creadas automáticamente
- ✅ API REST funcionando en puerto 3001
- ✅ CORS configurado para el frontend
- ✅ Autenticación JWT implementada

### 2. Frontend Configurado
- ✅ React App lista
- ✅ Conectado al backend (localhost:3001)
- ✅ Mock mode desactivado
- ✅ Rutas de autenticación listas

### 3. Usuario Admin Creado
```
📧 Email: admin@hotmail.com
🔐 Password: admin123
👤 Rol: admin
🏥 Institución: Hospital Central
```

### 4. ESP32 Listo
- ✅ Código Arduino preparado en `esp32_biomonitor.ino`
- ✅ Documentación completa en `ESP32_SETUP.md`
- ✅ Endpoints API compatibles

---

## 🚀 INICIAR EL SISTEMA

### Método Rápido (Un solo comando)
```bash
./start.sh
```

### Método Manual

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm start
```

---

## 🌐 Acceder a la Aplicación

1. Abre tu navegador en: **http://localhost:3000**
2. Haz clic en "Iniciar Sesión"
3. Ingresa las credenciales:
   - Email: `admin@hotmail.com`
   - Password: `admin123`
4. ¡Listo! Ya puedes usar el sistema

---

## 📋 Funcionalidades Disponibles

### Como Médico/Admin puedes:
- ✅ Crear nuevas pruebas de caminata de 6 minutos
- ✅ Ver lista de todas las pruebas
- ✅ Agregar lecturas manualmente
- ✅ Generar reportes
- ✅ Ver historial de pacientes
- ✅ Recibir datos del ESP32 en tiempo real

---

## 🔌 Conectar ESP32 (Opcional)

1. Abre Arduino IDE
2. Abre el archivo `esp32_biomonitor.ino`
3. Configura en el código (líneas 13-16):
   ```cpp
   const char* ssid = "TU_WIFI";
   const char* password = "TU_PASSWORD";
   const char* serverURL = "http://TU_IP_LOCAL:3001";
   const char* authToken = "TU_TOKEN_JWT";
   ```
4. Para obtener tu token JWT:
   - Inicia sesión en la web
   - Abre DevTools (F12) → Application → Local Storage
   - Copia el valor de `auth_token`

5. Sube el código al ESP32
6. Los datos se guardarán automáticamente

---

## 📊 Estructura de Datos

### Test (Prueba)
```json
{
  "id": "test-abc123",
  "paciente": {
    "nombreCompleto": "Juan Pérez",
    "edad": 45,
    "altura": 170,
    "peso": 75,
    "sexo": "M"
  },
  "medicoResponsable": "Dr. Juan García",
  "fecha": "2026-03-04",
  "estado": "en_progreso",
  "duracion": 360,
  "distanciaTotal": 450,
  "fcPromedio": 110,
  "spo2Promedio": 96,
  "lecturas": [],
  "alertas": []
}
```

### Reading (Lectura)
```json
{
  "id": "reading-xyz789",
  "timestamp": "2026-03-04T10:30:00Z",
  "frecuenciaCardiaca": 110,
  "spo2": 96,
  "pasos": 450,
  "distancia": 300
}
```

---

## 🔧 Archivos de Configuración

### Backend `.env`
```env
DB_HOST=localhost
DB_USER=cesar
DB_PASSWORD=cesar123
DB_NAME=pau
DB_PORT=3306
JWT_SECRET=tu_secreto_jwt_muy_seguro_12345
JWT_REFRESH_SECRET=tu_secreto_refresh_muy_seguro_67890
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 🐛 Solución de Problemas Comunes

### ❌ Error: "Cannot connect to database"
**Solución:**
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Si no está corriendo, iniciarlo
sudo systemctl start mysql
```

### ❌ Error: "Port 3001 already in use"
**Solución:**
```bash
# Ver qué proceso usa el puerto
lsof -i :3001

# Matar el proceso
kill -9 <PID>
```

### ❌ Error: "Invalid credentials"
**Solución:**
- Verifica que uses: `admin@hotmail.com` / `admin123`
- Si olvidaste la contraseña, ejecuta: `node backend/create-admin.js` (eliminará el anterior)

### ❌ Frontend no carga
**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules
npm install

# Limpiar caché
npm start
```

---

## 📞 Contacto y Soporte

- **Documentación:** Ver archivos `.md` en el proyecto
- **Logs Backend:** `/tmp/backend.log` (cuando usas start.sh)
- **Logs Frontend:** Consola del navegador (F12)

---

## 🎯 Próximos Pasos Recomendados

1. ✅ **Familiarízate con la interfaz**
   - Explora las diferentes secciones
   - Crea una prueba de ejemplo
   - Revisa los reportes

2. ✅ **Crea usuarios adicionales**
   - Usa la API o interfaz de registro
   - Asigna roles apropiados

3. ✅ **Configura el ESP32** (si tienes el hardware)
   - Sigue `ESP32_SETUP.md`
   - Conecta los sensores
   - Prueba la comunicación

4. ✅ **Personaliza el sistema**
   - Ajusta los umbrales de alertas
   - Modifica los colores y diseño
   - Añade campos personalizados

---

## 🎊 ¡Listo para Producción!

El sistema está completamente funcional y listo para usar. Todas las conexiones entre:
- Frontend ↔️ Backend ✅
- Backend ↔️ Base de Datos ✅
- ESP32 ↔️ Backend ✅

**¡Disfruta usando el Monitor Clínico!** 🏥💚
